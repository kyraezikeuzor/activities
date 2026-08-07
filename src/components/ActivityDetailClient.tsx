"use client";

import { useState, type ReactNode } from "react";
import { Mail } from "lucide-react";
import { SignUpPanel } from "@/components/SignUpPanel";
import { NextSteps } from "@/components/NextSteps";
import { VOLUNTEER_EMAIL } from "@/lib/format";

export type RecentSignUp = {
  id: string;
  name: string;
};

type ActivityDetailClientProps = {
  activityId: string;
  type: string | null;
  submissionFormat: string | null;
  slotsFilled: number;
  slotsTotal: number;
  isFull: boolean;
  recentSignUps: RecentSignUp[];
  leftColumn: ReactNode;
};

/**
 * Shares the volunteer email from SignUpPanel with Next Steps Fillout URLs.
 */
export function ActivityDetailClient({
  activityId,
  type,
  submissionFormat,
  slotsFilled,
  slotsTotal,
  isFull,
  recentSignUps,
  leftColumn,
}: ActivityDetailClientProps) {
  const [email, setEmail] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <div className="space-y-6 p-6 sm:p-8 lg:border-r lg:border-border">
        {leftColumn}
        <NextSteps
          activityId={activityId}
          type={type}
          submissionFormat={submissionFormat}
          email={email}
        />
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Questions? Email{" "}
            <a
              href={`mailto:${VOLUNTEER_EMAIL}`}
              className="font-medium text-primary underline underline-offset-2 hover:text-sunrise-600"
            >
              {VOLUNTEER_EMAIL}
            </a>
          </span>
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <SignUpPanel
          activityId={activityId}
          slotsFilled={slotsFilled}
          slotsTotal={slotsTotal}
          isFull={isFull}
          recentSignUps={recentSignUps}
          onEmailChange={setEmail}
        />
      </div>
    </div>
  );
}
