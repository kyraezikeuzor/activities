import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@omelora/sunrise";
import type { Activity } from "@/lib/airtable";

export function ActivityBoardCard({ activity }: { activity: Activity }) {
  return (
    <Card
      variant="outline"
      className="flex h-full flex-col rounded-xl border-2 border-border !p-5 shadow-none sm:!p-5"
    >
      <CardContent className="flex flex-1 flex-col gap-2">
        <h3 className="text-base font-semibold leading-snug text-foreground/75">
          {activity.title}
        </h3>

        {/* Description temporarily hidden
        {activity.description ? (
          <p className="mt-0.5 line-clamp-2 font-medium text-muted-foreground">
            {activity.description}
          </p>
        ) : null}
        */}

        <div className="flex flex-col gap-1.5 pt-0.5 font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              {activity.slotsFilled} of {activity.slotsTotal} spots filled
            </span>
          </div>
          {activity.hours > 0 ? (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                {activity.hours} {activity.hours === 1 ? "hour" : "hours"}
              </span>
            </div>
          ) : null}
        </div>

        {activity.location ? (
          <span className="inline-flex w-fit rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {activity.location}
          </span>
        ) : null}

        <Link
          href={`/${activity.slug}`}
          className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-sunrise-600"
        >
          View &amp; Claim
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
