import Link from "next/link";
import type { Activity } from "@/lib/airtable";

export function ActivityBoardRow({ activity }: { activity: Activity }) {
  const metaParts: string[] = [
    `${activity.slotsFilled} of ${activity.slotsTotal} spots filled`,
  ];
  if (activity.hours > 0) {
    metaParts.push(
      `${activity.hours} ${activity.hours === 1 ? "hour" : "hours"}`
    );
  }

  return (
    <Link
      href={`/${activity.slug}`}
      className="flex items-center justify-between gap-3 border-b border-border px-2 py-2.5 transition-colors last:border-b-0 hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold leading-snug text-foreground/75">
          {activity.title}
        </h3>
        <p className="mt-0.5 text-sm font-medium tracking-normal text-muted-foreground">
          {metaParts.join(" · ")}
        </p>
      </div>
      <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-sm">
        View
      </span>
      <span className="sr-only"> {activity.title}</span>
    </Link>
  );
}
