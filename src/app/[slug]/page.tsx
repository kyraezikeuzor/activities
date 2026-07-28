import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
} from "lucide-react";
import { SignUpPanel } from "@/components/SignUpPanel";
import { InstructionList } from "@/components/InstructionList";
import { getActivityBySlug } from "@/lib/activitiesCache";
import {
  formatDeadline,
  HOURS_REQUEST_FORM_URL,
  parseInstructionLines,
  VOLUNTEER_EMAIL,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) return { title: "Activity not found" };
  return {
    title: `${activity.title} · Omelora`,
    description: activity.description ?? undefined,
  };
}

function MetaIcon({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const CATEGORY_BADGE: Record<string, string> = {
  education: "bg-sky-500 text-white",
  fundraising: "bg-pink-500 text-white",
  programs: "bg-navy-700 text-white",
  supplies: "bg-sunrise-600 text-white",
};

function categoryBadgeClass(category: string | null): string {
  if (!category) return "bg-sky-500 text-white";
  return (
    CATEGORY_BADGE[category.trim().toLowerCase()] ?? "bg-sky-500 text-white"
  );
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const deadline = formatDeadline(activity.endDate);
  const instructionLines = activity.instructions
    ? parseInstructionLines(activity.instructions)
    : [];
  const isFull =
    activity.status?.toLowerCase() === "full" ||
    (activity.slotsTotal > 0 &&
      activity.slotsFilled >= activity.slotsTotal);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/activity-bg.jpg)" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium tracking-normal text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Activities
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            {/* Left: activity details */}
            <div className="space-y-6 p-6 sm:p-8 lg:border-r lg:border-border">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {activity.category ? (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryBadgeClass(activity.category)}`}
                    >
                      {activity.category}
                    </span>
                  ) : null}
                  {activity.type ? (
                    <span className="inline-flex rounded-full border border-border bg-white px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {activity.type}
                    </span>
                  ) : null}
                </div>

                <h1 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
                  {activity.title}
                </h1>

                {activity.description ? (
                  <p className="text-sm leading-relaxed tracking-normal text-muted-foreground sm:text-base">
                    {activity.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-8">
                {activity.hours > 0 ? (
                  <div className="flex items-start gap-3">
                    <MetaIcon className="bg-muted text-muted-foreground">
                      <Clock className="h-4 w-4" aria-hidden />
                    </MetaIcon>
                    <div>
                      <p className="text-xs text-muted-foreground">Hours</p>
                      <p className="text-base font-bold text-foreground">
                        {activity.hours}
                      </p>
                    </div>
                  </div>
                ) : null}

                {deadline ? (
                  <div className="flex items-start gap-3">
                    <MetaIcon className="bg-muted text-muted-foreground">
                      <Calendar className="h-4 w-4" aria-hidden />
                    </MetaIcon>
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="text-base font-bold text-foreground">
                        {deadline}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {instructionLines.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Instructions
                  </h2>
                  <InstructionList lines={instructionLines} />
                </section>
              ) : null}

              <div className="rounded-xl bg-muted px-4 py-4 sm:px-5">
                <h2 className="text-sm font-bold tracking-normal text-foreground">
                  Next Steps
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Submit the{" "}
                  <a
                    href={HOURS_REQUEST_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2 hover:text-sunrise-600"
                  >
                    Hours Request Form
                  </a>{" "}
                  once you have completed this activity.
                </p>
              </div>

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

            {/* Right: sign ups */}
            <div className="p-6 sm:p-8">
              <SignUpPanel
                activityId={activity.id}
                slotsFilled={activity.slotsFilled}
                slotsTotal={activity.slotsTotal}
                isFull={isFull}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
