import { NextResponse } from "next/server";
import {
  createClaim,
  enrichActivityWithClaims,
  fetchAllClaims,
  fetchPersonByEmail,
  getActivityRecordById,
  mapActivityRecord,
  updateClaimStatus,
  type Activity,
  type Claim,
  type ClaimStatus,
} from "@/lib/airtable";
import { isOccupyingClaim } from "@/lib/claims";
import { upsertActivityInCache } from "@/lib/activitiesCache";

export const dynamic = "force-dynamic";

const signupTails = new Map<string, Promise<void>>();

type SuccessfulClaimStatus = Exclude<ClaimStatus, "Cancelled">;

type SignUpResponse = {
  ok: true;
  alreadyClaimed: boolean;
  claim: {
    id: string;
    personId: string;
    activityId: string;
    status: SuccessfulClaimStatus;
    claimedAt: string;
  };
  activity: {
    id: string;
    slug: string;
    slotsFilled: number;
    slotsTotal: number;
    signUpIds: string[];
    status: string | null;
  };
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidActivityId(activityId: string): boolean {
  return /^rec[a-z0-9]+$/i.test(activityId);
}

function successfulStatus(claim: Claim): SuccessfulClaimStatus | null {
  const status = claim.status.trim().toLowerCase();
  if (status === "claimed") return "Claimed";
  if (status === "in progress") return "In Progress";
  if (status === "pending review") return "Pending Review";
  if (status === "completed") return "Completed";
  return null;
}

function activityResponse(activity: Activity): SignUpResponse["activity"] {
  return {
    id: activity.id,
    slug: activity.slug,
    slotsFilled: activity.slotsFilled,
    slotsTotal: activity.slotsTotal,
    signUpIds: activity.signUpIds,
    status: activity.status,
  };
}

function claimResponse(
  claim: Claim,
  personId: string,
  activityId: string
): SignUpResponse["claim"] {
  const status = successfulStatus(claim);
  if (!status) throw new Error("Claim did not have a successful status");

  return {
    id: claim.id,
    personId,
    activityId,
    status,
    claimedAt: claim.claimedAt,
  };
}

/** Serialize same-process signups per Activity, including identical pairs. */
async function withSignupLock<T>(
  key: string,
  work: () => Promise<T>
): Promise<T> {
  const previous = signupTails.get(key) ?? Promise.resolve();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.catch(() => undefined).then(() => gate);
  signupTails.set(key, tail);

  await previous.catch(() => undefined);
  try {
    return await work();
  } finally {
    release();
    if (signupTails.get(key) === tail) signupTails.delete(key);
  }
}

async function refreshActivitySummary(
  activityId: string,
  fallbackRecord: NonNullable<
    Awaited<ReturnType<typeof getActivityRecordById>>
  >
): Promise<{ activity: Activity; claims: Claim[] }> {
  const [record, claims] = await Promise.all([
    getActivityRecordById(activityId),
    fetchAllClaims(),
  ]);
  const activity = enrichActivityWithClaims(
    mapActivityRecord(record ?? fallbackRecord),
    claims
  );
  upsertActivityInCache(activity);
  return { activity, claims };
}

/**
 * Create or reactivate a first-class Claim for a Person resolved from email.
 * POST /api/activities/sign-up  { activityId: string, email: string }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const activityId =
    typeof raw.activityId === "string" ? raw.activityId.trim() : "";
  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";

  if (!isValidActivityId(activityId) || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid activity and email address." },
      { status: 400 }
    );
  }

  try {
    // This intentionally bypasses the five-minute People cache. The server
    // resolves authorization for the write from the submitted email itself.
    const person = await fetchPersonByEmail(email);
    if (!person) {
      return NextResponse.json(
        { error: "Volunteer profile not found." },
        { status: 404 }
      );
    }

    return await withSignupLock(activityId, async () => {
      // Capacity and duplicate decisions always use fresh Airtable records.
      const [activityRecord, claims] = await Promise.all([
        getActivityRecordById(activityId),
        fetchAllClaims(),
      ]);

      if (!activityRecord) {
        return NextResponse.json(
          { error: "Activity not found." },
          { status: 404 }
        );
      }

      const activity = enrichActivityWithClaims(
        mapActivityRecord(activityRecord),
        claims
      );
      const normalizedActivityStatus = activity.status?.trim().toLowerCase();
      if (normalizedActivityStatus === "closed") {
        return NextResponse.json(
          { error: "This activity is closed." },
          { status: 409 }
        );
      }

      const pairClaims = claims
        .filter(
          (claim) =>
            claim.personId === person.id && claim.activityId === activityId
        )
        .sort((a, b) => b.createdTime.localeCompare(a.createdTime));
      const existing = pairClaims.find(isOccupyingClaim);

      // Idempotency wins over capacity: a current claimant may retry even when
      // their own spot makes the activity full.
      if (existing) {
        upsertActivityInCache(activity);
        const response: SignUpResponse = {
          ok: true,
          alreadyClaimed: true,
          claim: claimResponse(existing, person.id, activityId),
          activity: activityResponse(activity),
        };
        return NextResponse.json(response, { status: 200 });
      }

      const isFull =
        normalizedActivityStatus === "full" ||
        (activity.slotsTotal > 0 &&
          activity.slotsFilled >= activity.slotsTotal);
      if (isFull) {
        return NextResponse.json(
          { error: "This activity is full." },
          { status: 409 }
        );
      }

      const cancelled = pairClaims.find(
        (claim) => claim.status.trim().toLowerCase() === "cancelled"
      );
      const mutatedClaim = cancelled
        ? await updateClaimStatus(cancelled.id, "Claimed")
        : await createClaim({ personId: person.id, activityId });

      const fresh = await refreshActivitySummary(activityId, activityRecord);
      const claim =
        fresh.claims.find((candidate) => candidate.id === mutatedClaim.id) ??
        mutatedClaim;
      const response: SignUpResponse = {
        ok: true,
        alreadyClaimed: false,
        claim: claimResponse(claim, person.id, activityId),
        activity: activityResponse(fresh.activity),
      };

      return NextResponse.json(response, { status: cancelled ? 200 : 201 });
    });
  } catch (error) {
    console.error("[api/activities/sign-up] failed", error);
    return NextResponse.json(
      { error: "Unable to sign up right now. Please try again." },
      { status: 500 }
    );
  }
}
