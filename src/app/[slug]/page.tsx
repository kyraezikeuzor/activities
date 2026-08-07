import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { ActivityDetailClient } from "@/components/ActivityDetailClient";
import { ActivityDetailHeader } from "@/components/ActivitiesHeader";
import { InstructionList } from "@/components/InstructionList";
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

const sectionTitleClass =
  "text-base font-semibold tracking-normal text-foreground/75";

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

  // Most recent sign-ups last in Airtable array — show newest first, cap at 8
  const signUpPeople = await getPeopleByIds([...activity.signUpIds].reverse());
  const recentSignUps = signUpPeople.slice(0, 8).map((person) => ({
    id: person.id,
    name: formatShortName(person.firstName, person.lastName),
  }));

  const leftColumn = (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {activity.category ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${categoryStyle.badge}`}
            >
              <CategoryIcon className="h-3.5 w-3.5" aria-hidden />
              {activity.category}
            </span>
          ) : null}
          {activity.type ? (
            <span className="inline-flex items-center rounded-full border border-border bg-white px-2.5 py-1 text-[13px] font-medium text-foreground">
              {activity.type}
            </span>
          ) : null}
        </div>

        <h1 className="text-[1.45rem] font-bold leading-tight tracking-normal text-foreground/75 sm:text-[1.65rem]">
          {activity.title}
        </h1>

        {activity.description ? (
          <p className="font-normal tracking-normal text-muted-foreground">
            {activity.description}
          </p>
        ) : null}

        {(activity.hours > 0 || deadline) ? (
          <div className="flex flex-wrap items-center gap-8 font-normal tracking-normal text-muted-foreground">
            {activity.hours > 0 ? (
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Hours:{" "}
                <span className="text-lg font-bold text-foreground/75">
                  {activity.hours}
                </span>
              </p>
            ) : null}
            {deadline ? (
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Deadline:{" "}
                <span className="text-lg font-bold text-foreground/75">
                  {deadline}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {instructionBlocks.length > 0 ? (
        <section className="space-y-3">
          <h2 className={sectionTitleClass}>Instructions</h2>
          <InstructionList blocks={instructionBlocks} />
        </section>
      ) : null}
    </>
  );

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/activity-bg.jpg)" }}
    >
      <ActivityDetailHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Activities
        </Link>

        <div className="overflow-hidden rounded-3xl border-4 border-white bg-white shadow-none">
          <ActivityDetailClient
            activityId={activity.id}
            type={activity.type}
            submissionFormat={activity.submissionFormat}
            slotsFilled={activity.slotsFilled}
            slotsTotal={activity.slotsTotal}
            isFull={isFull}
            recentSignUps={recentSignUps}
            leftColumn={leftColumn}
          />
        </div>
      </div>
    </div>
  );
}
