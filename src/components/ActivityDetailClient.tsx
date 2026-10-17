"use client";

import { useState, type ReactNode } from "react";
import { Mail } from "lucide-react";
import { SignUpPanel } from "@/components/SignUpPanel";
import { NextSteps } from "@/components/NextSteps";
import { VOLUNTEER_EMAIL, type InstructionBlock } from "@/lib/format";

export type RecentSignUp = {
  id: string;
  name: string;
  initials: string;
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
  instructionBlocks: InstructionBlock[];
  projectId?: string;
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
  instructionBlocks,
  projectId,
}: ActivityDetailClientProps) {
  const [email, setEmail] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-16">
      <div className="space-y-8">
        {leftColumn}
        <NextSteps
          activityId={activityId}
          type={type}
          submissionFormat={submissionFormat}
          email={email}
          instructionBlocks={instructionBlocks}
          projectId={projectId}
        />
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Questions? Email{" "}
            <a
              href={`mailto:${VOLUNTEER_EMAIL}`}
              className="font-medium text-foreground underline underline-offset-2 hover:text-sunrise-600"
            >
              {VOLUNTEER_EMAIL}
            </a>
          </span>
        </p>
      </div>

      <div className="rounded-xl border border-border p-6 lg:sticky lg:top-6">
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
