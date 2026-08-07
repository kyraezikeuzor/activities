"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Loader2, UserPlus, Users } from "lucide-react";
import type { RecentSignUp } from "@/components/ActivityDetailClient";
import { formatShortName } from "@/lib/category";
import { avatarToneClass } from "@/lib/format";

const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

type MatchedPerson = {
  id: string;
  email: string | null;
  displayName: string;
  initials: string;
  firstName?: string | null;
  lastName?: string | null;
};

type SignUpPanelProps = {
  activityId: string;
  slotsFilled: number;
  slotsTotal: number;
  isFull: boolean;
  recentSignUps?: RecentSignUp[];
  onEmailChange?: (email: string | null) => void;
};

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; person: MatchedPerson }
  | { status: "signing_up"; person: MatchedPerson }
  | { status: "signed_up"; person: MatchedPerson }
  | { status: "not_found" }
  | { status: "error"; message: string };

export function SignUpPanel({
  activityId,
  slotsFilled: initialSlotsFilled,
  slotsTotal,
  isFull: initialIsFull,
  recentSignUps: initialRecentSignUps = [],
  onEmailChange,
}: SignUpPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [slotsFilled, setSlotsFilled] = useState(initialSlotsFilled);
  const [recentSignUps, setRecentSignUps] = useState(initialRecentSignUps);

  // Keep spots in sync when the server re-renders with a fresh Airtable rollup
  useEffect(() => {
    setSlotsFilled(initialSlotsFilled);
  }, [initialSlotsFilled]);

  useEffect(() => {
    setRecentSignUps(initialRecentSignUps);
  }, [initialRecentSignUps]);

  const isFull =
    initialIsFull || (slotsTotal > 0 && slotsFilled >= slotsTotal);

  async function lookupPerson(trimmed: string) {
    setLookup({ status: "loading" });
    console.log("[SignUpPanel] looking up person", { email: trimmed });

    const res = await fetch("/api/lookup-person", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const data = (await res.json()) as {
      found?: boolean;
      person?: MatchedPerson | null;
      error?: string;
    };

    console.log("[SignUpPanel] lookup response", { status: res.status, data });

    if (!res.ok) {
      setLookup({
        status: "error",
        message: data.error || "Lookup failed.",
      });
      return;
    }

    if (data.found && data.person) {
      setLookup({ status: "found", person: data.person });
      onEmailChange?.(data.person.email ?? trimmed);
    } else {
      setLookup({ status: "not_found" });
    }
  }

  async function confirmSignUp(person: MatchedPerson) {
    setLookup({ status: "signing_up", person });

    console.log("[SignUpPanel] confirming sign-up submit", {
      activityId,
      personId: person.id,
      email: person.email,
    });

    try {
      const res = await fetch("/api/activities/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          personId: person.id,
          email: person.email,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        activity?: {
          id: string;
          slotsFilled: number;
          slotsTotal: number;
          signUpIds: string[];
        };
      };

      console.log("[SignUpPanel] sign-up API response", {
        status: res.status,
        ok: res.ok,
        data,
      });

      if (!res.ok) {
        console.error("[SignUpPanel] sign-up FAILED", data);
        setLookup({
          status: "error",
          message: data.error || "Sign up failed.",
        });
        return;
      }

      if (typeof data.activity?.slotsFilled === "number") {
        console.log(
          "[SignUpPanel] updating slotsFilled from Airtable rollup",
          data.activity.slotsFilled
        );
        setSlotsFilled(data.activity.slotsFilled);
      }

      setRecentSignUps((prev) => {
        if (prev.some((s) => s.id === person.id)) return prev;
        return [
          {
            id: person.id,
            name: formatShortName(person.firstName, person.lastName),
            initials: person.initials,
          },
          ...prev,
        ].slice(0, 8);
      });

      setLookup({ status: "signed_up", person });
      router.refresh();
    } catch (err) {
      console.error("[SignUpPanel] sign-up threw", err);
      setLookup({
        status: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong. Try again.",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Phase 2: profile already found → write to Airtable Linked Sign Ups
    if (lookup.status === "found") {
      await confirmSignUp(lookup.person);
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setLookup({
        status: "error",
        message: "Enter a valid email address.",
      });
      return;
    }
    if (isFull) {
      setLookup({ status: "error", message: "This activity is full." });
      return;
    }

    try {
      await lookupPerson(trimmed);
    } catch (err) {
      console.error("[SignUpPanel] lookup threw", err);
      setLookup({
        status: "error",
        message: "Something went wrong. Try again.",
      });
    }
  }

  const inputHighlight =
    lookup.status === "found" ||
    lookup.status === "signing_up" ||
    lookup.status === "signed_up"
      ? "border-primary ring-2 ring-primary/20"
      : "border-border";

  const busy =
    lookup.status === "loading" || lookup.status === "signing_up";

  const buttonLabel =
    lookup.status === "signed_up"
      ? "Signed Up"
      : lookup.status === "found"
        ? "Confirm Sign Up"
        : isFull
          ? "Full"
          : "Sign Up";

  return (
    <aside className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold tracking-normal text-foreground/75">
          Availability
        </h2>
        <div className="mt-3 flex items-center gap-2 font-normal text-muted-foreground">
          <Users className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            {slotsFilled} of {slotsTotal} spots filled
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold tracking-normal text-foreground/75">
            Volunteer Sign Up
          </h3>
          <p className="font-normal tracking-normal text-muted-foreground">
            Enter your email and sign up.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="volunteer-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            disabled={
              isFull ||
              busy ||
              lookup.status === "signed_up" ||
              lookup.status === "found"
            }
            onChange={(e) => {
              setEmail(e.target.value);
              onEmailChange?.(e.target.value.trim() || null);
              if (lookup.status !== "idle" && lookup.status !== "loading") {
                setLookup({ status: "idle" });
              }
            }}
            autoComplete="email"
            required
            aria-label="Volunteer email"
            className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${inputHighlight}`}
          />

          {lookup.status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Looking up your profile…
            </div>
          ) : null}

          {lookup.status === "signing_up" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Adding you to this activity…
            </div>
          ) : null}

          {lookup.status === "found" ||
          lookup.status === "signing_up" ||
          lookup.status === "signed_up" ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarToneClass(lookup.person.id)}`}
              >
                {lookup.person.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {lookup.person.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {lookup.person.email}
                </p>
              </div>
            </div>
          ) : null}

          {lookup.status === "not_found" ? (
            <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
              <p className="text-sm font-medium text-foreground">
                We couldn&apos;t find a volunteer profile for this email.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Not a volunteer yet?{" "}
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-2 hover:text-sunrise-600"
                >
                  Apply here
                </a>
              </p>
            </div>
          ) : null}

          {lookup.status === "error" ? (
            <p className="text-xs text-destructive">{lookup.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={
              isFull ||
              busy ||
              lookup.status === "signed_up" ||
              lookup.status === "not_found"
            }
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold tracking-normal text-primary-foreground shadow-sm transition-colors hover:bg-sunrise-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : lookup.status === "signed_up" ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden />
            )}
            {buttonLabel}
          </button>
        </form>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="text-base font-medium tracking-normal text-foreground/75">
          Recent Sign Ups
        </h3>
        {recentSignUps.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No one has signed up yet. Be the first!
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {recentSignUps.map((signUp) => (
              <li key={signUp.id} className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarToneClass(signUp.id)}`}
                >
                  {signUp.initials}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {signUp.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
