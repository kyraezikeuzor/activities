"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Users } from "lucide-react";
import { BRIDGE_URL } from "@/components/SiteHeader";
import { avatarColor } from "@/lib/avatar";
import { typography } from "@/styles/typography";

const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

export type RecentSignUp = { id: string; name: string; initials: string };
type Person = { id: string; email: string | null; displayName: string; initials: string };
type Step =
  | { kind: "email" }
  | { kind: "looking" }
  | { kind: "confirm"; person: Person }
  | { kind: "signing"; person: Person }
  | { kind: "done"; person: Person; already: boolean }
  | { kind: "not_found" };

function availability(slotsFilled: number, slotsTotal: number): string {
  if (slotsTotal > 0) return `${Math.min(slotsFilled, slotsTotal)} of ${slotsTotal} spots filled`;
  if (slotsFilled > 0) return `${slotsFilled} signed up`;
  return "Open to everyone";
}

function Avatar({ id, initials, size = "h-9 w-9 text-sm" }: { id: string; initials: string; size?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${size} ${avatarColor(id)}`} aria-hidden>
      {initials}
    </span>
  );
}

/** Sign up with your email here, then do the work in Bridge. */
export function ActivityActionCard({
  activityId,
  slotsFilled,
  slotsTotal,
  isFull,
  recentSignUps,
  totalSignUps,
}: {
  activityId: string;
  slotsFilled: number;
  slotsTotal: number;
  isFull: boolean;
  recentSignUps: RecentSignUp[];
  totalSignUps: number;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [error, setError] = useState("");
  const bridgeHref = `${BRIDGE_URL}/start/${activityId}`;
  const more = totalSignUps - recentSignUps.length;

  async function findMe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@")) return setError("Enter a valid email address.");
    setError("");
    setStep({ kind: "looking" });
    try {
      const res = await fetch("/api/lookup-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json()) as { found?: boolean; person?: Person; error?: string };
      if (!res.ok) throw new Error(data.error || "We couldn't look up that email.");
      setStep(data.found && data.person ? { kind: "confirm", person: data.person } : { kind: "not_found" });
    } catch (err) {
      setStep({ kind: "email" });
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  async function confirm(person: Person) {
    setError("");
    setStep({ kind: "signing", person });
    try {
      const res = await fetch("/api/activities/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, email: person.email ?? email.trim() }),
      });
      const data = (await res.json()) as { alreadyClaimed?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Sign up failed.");
      setStep({ kind: "done", person, already: data.alreadyClaimed === true });
      router.refresh();
    } catch (err) {
      setStep({ kind: "confirm", person });
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  const person = "person" in step ? step.person : null;

  return (
    <aside className="rounded-xl border-2 border-border bg-background p-5 lg:sticky lg:top-6">
      <p className={`${typography.label} text-muted-foreground`}>Availability</p>
      <p className={`${typography.body} mt-2 flex items-center gap-2 text-foreground`}>
        <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {availability(slotsFilled, slotsTotal)}
      </p>

      <div className="mt-5 border-t border-border pt-5">
        {step.kind === "done" ? (
          <>
            <p className={`${typography.bodySmall} flex items-center gap-2 font-medium text-foreground`}>
              <Check className="h-4 w-4 text-emerald-600" aria-hidden />
              {step.already ? "You're already signed up." : "You're signed up!"}
            </p>
            <a
              href={bridgeHref}
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-bridge-action text-base font-semibold text-white transition-colors hover:bg-bridge-action-hover"
            >
              Continue in Bridge
              <ArrowRight className="h-5 w-5" aria-hidden />
            </a>
            <p className={`${typography.bodySmall} mt-3 text-muted-foreground`}>
              Sign in with {person?.email ?? "your Omelora email"} to submit your work.
            </p>
          </>
        ) : isFull ? (
          <p className="flex h-[52px] w-full items-center justify-center rounded-xl bg-muted text-base font-semibold text-muted-foreground">
            This activity is full
          </p>
        ) : person ? (
          <>
            <p className={`${typography.label} text-foreground`}>Is this you?</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-border p-3">
              <Avatar id={person.id} initials={person.initials} size="h-10 w-10 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{person.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{person.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => confirm(person)}
              disabled={step.kind === "signing"}
              className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-bridge-action text-base font-semibold text-white transition-colors hover:bg-bridge-action-hover disabled:opacity-70"
            >
              {step.kind === "signing" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {step.kind === "signing" ? "Signing you up…" : "Confirm sign up"}
            </button>
            <button
              type="button"
              onClick={() => { setStep({ kind: "email" }); setError(""); }}
              className={`${typography.bodySmall} mt-2 w-full text-center text-muted-foreground underline underline-offset-4 hover:text-foreground`}
            >
              Use a different email
            </button>
          </>
        ) : (
          <form onSubmit={findMe}>
            <label htmlFor="volunteer-email" className={`${typography.label} text-foreground`}>
              Sign up with your Omelora email
            </label>
            <input
              id="volunteer-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (step.kind === "not_found") setStep({ kind: "email" }); }}
              placeholder="you@example.com"
              className="mt-2 h-11 w-full rounded-lg border-2 border-border bg-background px-3 text-sm outline-none focus-visible:border-bridge-action"
            />
            <button
              type="submit"
              disabled={step.kind === "looking"}
              className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-bridge-action text-base font-semibold text-white transition-colors hover:bg-bridge-action-hover disabled:opacity-70"
            >
              {step.kind === "looking" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {step.kind === "looking" ? "Finding you…" : "Sign up"}
            </button>
            {step.kind === "not_found" && (
              <p className={`${typography.bodySmall} mt-3 text-foreground`}>
                We couldn&apos;t find a volunteer profile for that email.{" "}
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-bridge-action-hover underline underline-offset-2">
                  Apply to join
                </a>
              </p>
            )}
            <p className={`${typography.bodySmall} mt-3 text-muted-foreground`}>
              Already signed up?{" "}
              <a href={bridgeHref} className="font-medium text-bridge-action-hover underline underline-offset-2">
                Continue in Bridge
              </a>
            </p>
          </form>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {recentSignUps.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className={`${typography.label} text-muted-foreground`}>Recent sign ups</p>
          <ul className="mt-3 space-y-2.5">
            {recentSignUps.map((signUp) => (
              <li key={signUp.id} className={`${typography.bodySmall} flex items-center gap-2.5 text-foreground`}>
                <Avatar id={signUp.id} initials={signUp.initials} />
                {signUp.name}
              </li>
            ))}
          </ul>
          {more > 0 && <p className={`${typography.bodySmall} mt-2.5 text-muted-foreground`}>and {more} more</p>}
        </div>
      )}
    </aside>
  );
}
