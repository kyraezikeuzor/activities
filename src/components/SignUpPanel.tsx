"use client";

import { useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";

const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

type MatchedPerson = {
  id: string;
  email: string | null;
  displayName: string;
  initials: string;
};

type SignUpPanelProps = {
  slotsFilled: number;
  slotsTotal: number;
  isFull: boolean;
};

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; person: MatchedPerson }
  | { status: "not_found" }
  | { status: "error"; message: string };

export function SignUpPanel({
  slotsFilled,
  slotsTotal,
  isFull,
}: SignUpPanelProps) {
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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

    setLookup({ status: "loading" });

    try {
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

      if (!res.ok) {
        setLookup({
          status: "error",
          message: data.error || "Lookup failed.",
        });
        return;
      }

      if (data.found && data.person) {
        setLookup({ status: "found", person: data.person });
      } else {
        setLookup({ status: "not_found" });
      }
    } catch {
      setLookup({
        status: "error",
        message: "Something went wrong. Try again.",
      });
    }
  }

  const inputHighlight =
    lookup.status === "found"
      ? "border-primary ring-2 ring-primary/20"
      : lookup.status === "error" || lookup.status === "not_found"
        ? "border-border"
        : "border-border";

  return (
    <aside className="flex flex-col gap-5 lg:pl-8">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Sign Ups
        </h2>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {slotsFilled} of {slotsTotal} spots filled
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold tracking-normal text-foreground">
            Volunteer Sign Up
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter your email and click sign up to join this activity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="volunteer-email"
              className="text-sm font-bold text-foreground"
            >
              Volunteer Email
            </label>
            <p className="text-xs text-muted-foreground">
              Enter the email you used to apply to Omelora.
            </p>
            <input
              id="volunteer-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              disabled={isFull || lookup.status === "loading"}
              onChange={(e) => {
                setEmail(e.target.value);
                if (lookup.status !== "idle" && lookup.status !== "loading") {
                  setLookup({ status: "idle" });
                }
              }}
              autoComplete="email"
              required
              className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${inputHighlight}`}
            />
          </div>

          {lookup.status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Looking up your profile…
            </div>
          ) : null}

          {lookup.status === "found" ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunrise-100 text-sm font-bold text-primary">
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
            disabled={isFull || lookup.status === "loading"}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold tracking-normal text-primary-foreground shadow-sm transition-colors hover:bg-sunrise-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {lookup.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden />
            )}
            {isFull ? "Full" : "Sign Up"}
          </button>
        </form>
      </div>
    </aside>
  );
}
