import {
  CATEGORY_ICONS,
  CATEGORIES,
  type Category,
} from "@/lib/category";
import { ActivitiesHeader } from "@/components/ActivitiesHeader";
import { ActivityBoardCard } from "@/components/ActivityBoardCard";
import type { Activity } from "@/lib/airtable";

export { CATEGORIES, type Category } from "@/lib/category";

/**
 * Board shows Open / Full. Live Airtable also uses "Active" for open slots —
 * treat Active as Open; always hide Closed.
 */
export function isBoardVisible(activity: Activity): boolean {
  const status = activity.status?.trim().toLowerCase() ?? "";
  return status === "open" || status === "full" || status === "active";
}

function matchesCategory(activity: Activity, category: Category): boolean {
  return activity.category?.trim().toLowerCase() === category.toLowerCase();
}

export function ActivitiesBoard({ activities }: { activities: Activity[] }) {
  const visible = activities.filter(isBoardVisible);

  return (
    <div>
      <ActivitiesHeader />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-7">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 xl:flex xl:flex-row xl:justify-between xl:gap-6">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const columnActivities = visible.filter((a) =>
              matchesCategory(a, category)
            );

            return (
              <section
                key={category}
                className="flex min-w-0 w-full flex-col gap-3 xl:w-[15.5rem] xl:shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <h2 className="text-base font-medium text-muted-foreground">
                    {category}
                  </h2>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                    {columnActivities.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnActivities.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm italic tracking-normal text-muted-foreground">
                      No activities
                    </p>
                  ) : (
                    columnActivities.map((activity) => (
                      <ActivityBoardCard
                        key={activity.id}
                        activity={activity}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
