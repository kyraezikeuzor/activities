import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { ActivityActionCard } from "@/components/ActivityActionCard";
import { InstructionList } from "@/components/InstructionList";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getActivityBySlug } from "@/lib/activitiesCache";
import { formatShortName } from "@/lib/category";
import { formatDeadline, parseInstructionBlocks } from "@/lib/format";
import { getPeopleByIds } from "@/lib/peopleCache";
import { typography } from "@/styles/typography";

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

function Chip({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className={`${typography.bodySmall} inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-foreground`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {children}
    </span>
  );
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const deadline = formatDeadline(activity.endDate);
  const instructionBlocks = activity.instructions ? parseInstructionBlocks(activity.instructions) : [];
  const isFull =
    activity.status?.toLowerCase() === "full" ||
    (activity.slotsTotal > 0 && activity.slotsFilled >= activity.slotsTotal);

  // Claim-enriched signup IDs are already newest first, then legacy.
  const signUpPeople = await getPeopleByIds(activity.signUpIds.slice(0, 5));
  const recentSignUps = signUpPeople.map((person) => ({
    id: person.id,
    name: formatShortName(person.firstName, person.lastName),
    initials: person.initials,
  }));

  return (
    <div
      className="flex min-h-screen flex-col bg-sunrise-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/activity-bg.jpg)" }}
    >
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/" className={`inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-border bg-background px-3.5 text-foreground transition-colors hover:bg-[#F8F8F8] ${typography.button}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Activities
        </Link>

        {/* One white card holds the whole activity, like the original design. */}
        <article className="mt-4 rounded-2xl border-2 border-border bg-background p-5 sm:p-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">{activity.title}</h1>
              {activity.description && (
                <p className={`${typography.body} whitespace-pre-line text-foreground`}>{activity.description}</p>
              )}
              {(activity.hours > 0 || deadline) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activity.hours > 0 && (
                    <Chip icon={Clock}>{activity.hours} {activity.hours === 1 ? "hour" : "hours"}</Chip>
                  )}
                  {deadline && <Chip icon={Calendar}>Due {deadline}</Chip>}
                </div>
              )}
              {activity.projectName && (
                <p className={`${typography.bodySmall} text-[#4A4A4A]`}>
                  <span className="text-muted-foreground">Project: </span>
                  {activity.projectName}
                </p>
              )}
            </div>

            {/* On phones the action card comes right after the title, before the instructions. */}
            <div className="lg:row-span-2">
              <ActivityActionCard
                activityId={activity.id}
                slotsFilled={activity.slotsFilled}
                slotsTotal={activity.slotsTotal}
                isFull={isFull}
                recentSignUps={recentSignUps}
              totalSignUps={activity.slotsFilled}
              />
            </div>

            {instructionBlocks.length > 0 && (
              <section aria-labelledby="instructions-heading" className="rounded-xl border-2 border-border p-5">
                <h2 id="instructions-heading" className="mb-3 text-lg font-semibold text-foreground">Instructions</h2>
                <InstructionList blocks={instructionBlocks} />
              </section>
            )}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
