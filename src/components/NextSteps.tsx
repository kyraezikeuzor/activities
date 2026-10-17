"use client";

import type { ReactNode } from "react";
import { InstructionList } from "./InstructionList";
import { Card } from "@omelora/sunrise";
import { BRIDGE_URL } from "./PageHeader";
import {
  buildFilloutUrl,
  HOURS_REQUEST_FORM_URL,
  SUBMISSION_FORM_URL,
  type InstructionBlock,
} from "@/lib/format";

type NextStepsProps = {
  activityId: string;
  type: string | null;
  submissionFormat: string | null;
  email?: string | null;
  instructionBlocks?: InstructionBlock[];
  projectId?: string;
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
      className="font-medium text-foreground underline underline-offset-2 hover:text-sunrise-600"
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
    <div className="flex items-start gap-3 text-sm font-normal tracking-normal text-foreground">
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
  instructionBlocks = [],
  projectId,
}: NextStepsProps) {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  const isDonation = /donat|supply|supplies/.test(normalizedType) && !!projectId;
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

  const workStep = 2 + instructionBlocks.filter((block) => block.kind !== "sample").length;

  return (
    <Card className="space-y-3 border-2">
      <h2 className="text-lg font-semibold text-foreground">
        Instructions
      </h2>
      <div className="space-y-4">
        <StepRow number={1} lead="Sign up">
          {" "}
          for this activity
        </StepRow>

        <InstructionList blocks={instructionBlocks} start={2} />

        {isSubmission ? (
          <StepRow number={workStep} lead="Submit your work">
            {" "}
            → <StepLink href={submissionUrl}>Submission Form</StepLink>
          </StepRow>
        ) : null}

        {isParticipationOrAttendance ? (
          <StepRow number={workStep} lead="Complete the work" />
        ) : null}

        <StepRow number={workStep + (isSubmission || isParticipationOrAttendance ? 1 : 0)} lead="Request hours">
          {" "}
          for your work →{" "}
          <StepLink href={hoursUrl}>Hours Request Form</StepLink>
        </StepRow>
      </div>
      <div className="border-t border-border pt-5">
        <a href={isDonation ? `/projects/${projectId}#donations` : BRIDGE_URL} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted" target={isDonation ? undefined : "_blank"} rel={isDonation ? undefined : "noopener noreferrer"}>{isDonation ? "Donate project supplies" : "Continue in Bridge"}</a>
        <p className="mt-2 text-sm text-foreground">{isDonation ? "Choose the supplies you would like to contribute." : "Complete your activity and manage your volunteer work."}</p>
      </div>
    </Card>
  );
}
