"use client";

import type { ReactNode } from "react";
import {
  buildFilloutUrl,
  HOURS_REQUEST_FORM_URL,
  SUBMISSION_FORM_URL,
} from "@/lib/format";

type NextStepsProps = {
  activityId: string;
  type: string | null;
  submissionFormat: string | null;
  email?: string | null;
};

function StepLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-2 hover:text-sunrise-600"
    >
      {children}
    </a>
  );
}

function StepRow({
  number,
  lead,
  children,
}: {
  number: number;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 font-normal tracking-normal text-muted-foreground">
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold tabular-nums text-foreground"
        aria-hidden
      >
        {number}
      </span>
      <span className="min-w-0 leading-relaxed">
        <span className="font-semibold text-foreground/80">{lead}</span>
        {children}
      </span>
    </div>
  );
}

export function NextSteps({
  activityId,
  type,
  submissionFormat,
  email,
}: NextStepsProps) {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  const isSubmission = normalizedType === "submission";
  const isParticipationOrAttendance =
    normalizedType === "participation" || normalizedType === "attendance";

  const submissionUrl = buildFilloutUrl(SUBMISSION_FORM_URL, {
    activity_id: activityId,
    email: email ?? undefined,
    submission_type: submissionFormat?.toLowerCase() || "text",
  });

  const hoursUrl = buildFilloutUrl(HOURS_REQUEST_FORM_URL, {
    activity_id: activityId,
    email: email ?? undefined,
  });

  let step = 1;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-normal text-foreground/75">
        Next Steps
      </h2>
      <div className="space-y-4">
        <StepRow number={step++} lead="Sign up">
          {" "}
          for this activity
        </StepRow>

        {isSubmission ? (
          <StepRow number={step++} lead="Submit your work">
            {" "}
            → <StepLink href={submissionUrl}>Submission Form</StepLink>
          </StepRow>
        ) : null}

        {isParticipationOrAttendance ? (
          <StepRow number={step++} lead="Complete the work" />
        ) : null}

        <StepRow number={step++} lead="Request hours">
          {" "}
          for your work →{" "}
          <StepLink href={hoursUrl}>Hours Request Form</StepLink>
        </StepRow>
      </div>
    </section>
  );
}
