import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users, Clock3 } from "lucide-react";
import type { Activity } from "@/lib/airtable";
import { Card } from "@omelora/sunrise";
import { formatDeadline } from "@/lib/format";
import { participationType } from "@/lib/activityBrowsing";

export function ActivityCard({ activity }: { activity: Activity }) {
  const projectId = activity.fields["Linked Projects"]?.[0];
  const participation = participationType(activity);
  const deadline = formatDeadline(activity.endDate);
  const full = activity.status?.trim().toLowerCase() === "full";
  const spotsLeft = Math.max(0, activity.slotsTotal - activity.slotsFilled);
  return (
    <Card className="flex min-w-0 flex-col border-2 !p-4">
      <h2 className="break-words text-base font-semibold leading-snug">{activity.title}</h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {activity.category && <span>{activity.category}</span>}
        {participation && <span className="rounded bg-muted px-1.5 py-0.5">{participation}</span>}
        {full && <span className="font-medium">Full</span>}
      </div>
      {activity.description && <p className="hidden mt-2 line-clamp-2 break-words text-sm leading-5 text-muted-foreground">{activity.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-neutral-600">
        {deadline && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Due {deadline}
          </span>
        )}

        {participation === "In Person" && activity.location && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{activity.location}</span>
          </span>
        )}

        {activity.slotsTotal > 0 && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {full || spotsLeft === 0 ? "Full" : `${spotsLeft} spots left`}
          </span>
        )}

        {activity.hours > 0 && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            {activity.hours} {activity.hours === 1 ? "hour" : "hours"}
          </span>
        )}
      </div>
      <div className="mt-auto pt-3">
        {activity.projectName && (projectId ? (
          <Link href={`/projects/${projectId}`} title={activity.projectName} className="group mb-3 flex min-w-0 items-center gap-2 rounded-lg bg-muted p-2 transition-colors hover:bg-neutral-100">
            {activity.projectThumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activity.projectThumbnailUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-md object-cover" />
            )}
            <span className="min-w-0 flex-1 line-clamp-2 text-xs font-base leading-4">{activity.projectName}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ) : <p className="mb-3 line-clamp-2 rounded-lg bg-muted px-2.5 py-2 text-xs font-medium leading-4" title={activity.projectName}>{activity.projectName}</p>)}
        <Link href={`/${activity.slug}`} aria-label={`View Activity: ${activity.title}`} className="flex min-h-10 items-center justify-center rounded-xl bg-[#1aafed] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#149ed8] focus-visible:outline-[#149ed8]">View Activity</Link>
      </div>
    </Card>
  );
}
