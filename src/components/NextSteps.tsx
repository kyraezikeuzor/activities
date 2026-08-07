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
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 font-normal tracking-normal text-muted-foreground">
      <span className="w-4 shrink-0 text-center leading-normal tabular-nums">
        {number}.
      </span>
      <span className="min-w-0 leading-normal">{children}</span>
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
      <div className="space-y-2.5">
        <StepRow number={step++}>Sign up on this page</StepRow>

        {isSubmission ? (
          <StepRow number={step++}>
            Submit your work →{" "}
            <StepLink href={submissionUrl}>Submission Form</StepLink>
          </StepRow>
        ) : null}

        <StepRow number={step++}>
          Request hours for your work →{" "}
          <StepLink href={hoursUrl}>Hours Request Form</StepLink>
        </StepRow>
      </div>
    </section>
  );
}
