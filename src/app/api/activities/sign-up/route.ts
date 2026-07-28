import { NextResponse } from "next/server";
import { addPersonToActivitySignUps } from "@/lib/airtable";
import {
  refreshActivitiesCache,
  upsertActivityInCache,
} from "@/lib/activitiesCache";
import { getPersonByEmail } from "@/lib/peopleCache";

export const dynamic = "force-dynamic";

/**
 * Sign a Person up for an Activity (append to Linked Sign Ups).
 * POST /api/activities/sign-up
 * Body: { activityId: string, personId?: string, email?: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      activityId?: string;
      personId?: string;
      email?: string;
    };

    const activityId = body.activityId?.trim() ?? "";
    let personId = body.personId?.trim() ?? "";

    console.log("[api/activities/sign-up] request body", body);

    if (!activityId) {
      return NextResponse.json(
        { error: "Missing activityId" },
        { status: 400 }
      );
    }

    // Resolve person by id or email
    if (!personId && body.email) {
      const person = await getPersonByEmail(body.email);
      personId = person?.id ?? "";
      console.log("[api/activities/sign-up] resolved person from email", {
        email: body.email,
        personId: personId || null,
      });
    }

    if (!personId) {
      return NextResponse.json(
        { error: "Missing personId (or email that matches a People record)" },
        { status: 400 }
      );
    }

    console.log("[api/activities/sign-up] updating Activity", {
      activityId,
      personId,
      method: "PATCH",
      table: "Activities",
      field: "Linked Sign Ups",
    });

    const activity = await addPersonToActivitySignUps(activityId, personId);

    // Keep in-memory cache fresh for board + detail pages
    upsertActivityInCache(activity);
    await refreshActivitiesCache();

    console.log("[api/activities/sign-up] success", {
      activityId: activity.id,
      slotsFilled: activity.slotsFilled,
      slotsTotal: activity.slotsTotal,
      signUpIds: activity.signUpIds,
    });

    return NextResponse.json({
      ok: true,
      activity: {
        id: activity.id,
        slug: activity.slug,
        slotsFilled: activity.slotsFilled,
        slotsTotal: activity.slotsTotal,
        signUpIds: activity.signUpIds,
        status: activity.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/activities/sign-up] FAILED", {
      message,
      error,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
