import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@omelora/sunrise";
import type { Activity } from "@/lib/airtable";

export function ActivityBoardCard({ activity }: { activity: Activity }) {
  return (
    <Card
      variant="outline"
      className="flex h-full flex-col border border-border !p-4 shadow-sm sm:!p-4"
    >
      <CardContent className="flex flex-1 flex-col gap-2.5">
        {activity.type ? (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {activity.type}
          </p>
        ) : null}

        <h3 className="text-sm font-bold leading-snug tracking-normal text-foreground">
          {activity.title}
        </h3>

        {activity.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed tracking-normal text-muted-foreground">
            {activity.description}
          </p>
        ) : null}

        <div className="mt-auto space-y-2.5 pt-1">
          <div className="flex flex-col gap-1.5 text-[11px] tracking-normal text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {activity.slotsFilled} of {activity.slotsTotal} spots filled
              </span>
            </div>
            {activity.hours > 0 ? (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  {activity.hours} {activity.hours === 1 ? "hour" : "hours"}
                </span>
              </div>
            ) : null}
          </div>

          {activity.location ? (
            <span className="inline-flex w-fit rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-muted-foreground">
              {activity.location}
            </span>
          ) : null}

          <Link
            href={`/${activity.slug}`}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-bold tracking-normal text-primary-foreground shadow-sm transition-colors hover:bg-sunrise-600"
          >
            View &amp; Claim
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
