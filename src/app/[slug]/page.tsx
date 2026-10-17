import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { ActivityDetailClient } from "@/components/ActivityDetailClient";
import { PageHeader } from "@/components/PageHeader";
import { getActivityBySlug } from "@/lib/activitiesCache";
import { formatShortName, getCategoryStyle } from "@/lib/category";
import { formatDeadline, parseInstructionBlocks } from "@/lib/format";
import { getPeopleByIds } from "@/lib/peopleCache";

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

export default async function ActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const deadline = formatDeadline(activity.endDate);
  const instructionBlocks = activity.instructions
    ? parseInstructionBlocks(activity.instructions)
    : [];
  const isFull =
    activity.status?.toLowerCase() === "full" ||
    (activity.slotsTotal > 0 && activity.slotsFilled >= activity.slotsTotal);

  const categoryStyle = getCategoryStyle(activity.category);
  const CategoryIcon = categoryStyle.icon;

  // Claim-enriched signup IDs are already physical-newest-first, then legacy.
  const recentIds = activity.signUpIds.slice(0, 8);
  const signUpPeople = await getPeopleByIds(recentIds);
  const recentSignUps = signUpPeople.map((person) => ({
    id: person.id,
    name: formatShortName(person.firstName, person.lastName),
    initials: person.initials,
  }));

  const leftColumn = (
    <>
      <div className="space-y-4">


        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          {activity.title}
        </h1>

        {activity.description ? (
          <p className="whitespace-pre-line text-base font-normal leading-7 text-foreground">
            {activity.description}
          </p>
        ) : null}

        {(activity.hours > 0 || deadline) ? (
          <div className="flex flex-wrap items-center gap-2">
            {activity.hours > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="font-medium">Hours</span>
                <span className="font-bold text-foreground/75">
                  {activity.hours}
                </span>
              </span>
            ) : null}
            {deadline ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="font-medium">Deadline</span>
                <span className="font-bold text-foreground/75">{deadline}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

    </>
  );

  return (
    <div
      className="min-h-screen bg-white"
    >
      <PageHeader active="activities" />

      <div className="page-container py-8 sm:py-10">
        <Link
          href="/"
          className="mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Activities
        </Link>

        <div>
          <ActivityDetailClient
            activityId={activity.id}
            type={activity.type}
            submissionFormat={activity.submissionFormat}
            slotsFilled={activity.slotsFilled}
            slotsTotal={activity.slotsTotal}
            isFull={isFull}
            recentSignUps={recentSignUps}
            leftColumn={leftColumn}
            instructionBlocks={instructionBlocks}
            projectId={activity.fields["Linked Projects"]?.[0]}
          />
        </div>
      </div>
    </div>
  );
}
