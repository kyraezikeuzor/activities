"use client";

import { useState } from "react";
import {
  CATEGORY_ICONS,
  CATEGORIES,
  type Category,
} from "@/lib/category";
import { ActivitiesHeader } from "@/components/ActivitiesHeader";
import { ActivityBoardRow } from "@/components/ActivityBoardRow";
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

function CategoryColumn({
  category,
  activities,
  className = "",
}: {
  category: Category;
  activities: Activity[];
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category];

  return (
    <section className={`flex min-w-0 w-full flex-col ${className}`}>
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Icon
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <h2 className="text-base font-medium text-muted-foreground">
          {category}
        </h2>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
          {activities.length}
        </span>
      </div>

      <div className="flex flex-col pt-2">
        {activities.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm italic tracking-normal text-muted-foreground">
            No activities
          </p>
        ) : (
          activities.map((activity) => (
            <ActivityBoardRow key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </section>
  );
}

export function ActivitiesBoard({ activities }: { activities: Activity[] }) {
  const visible = activities.filter(isBoardVisible);
  const [mobileCategory, setMobileCategory] = useState<Category>(CATEGORIES[0]);

  const byCategory = CATEGORIES.map((category) => ({
    category,
    activities: visible.filter((a) => matchesCategory(a, category)),
  }));

  const mobileColumn =
    byCategory.find((c) => c.category === mobileCategory) ?? byCategory[0];

  return (
    <div>
      <ActivitiesHeader />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-7">
        {/* Mobile: category filter pills + single list */}
        <div className="md:hidden">
          <div
            className="flex gap-2 overflow-x-auto pb-4"
            role="tablist"
            aria-label="Activity categories"
          >
            {byCategory.map(({ category, activities: columnActivities }) => {
              const selected = category === mobileCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setMobileCategory(category)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-neutral-500 text-white"
                      : "border border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {category}
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {columnActivities.length}
                  </span>
                </button>
              );
            })}
          </div>

          <CategoryColumn
            category={mobileColumn.category}
            activities={mobileColumn.activities}
          />
        </div>

        {/* Desktop / tablet: multi-column lists */}
        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4">
          {byCategory.map(({ category, activities: columnActivities }) => (
            <CategoryColumn
              key={category}
              category={category}
              activities={columnActivities}
              className="md:px-2 md:first:pl-0 xl:px-3 xl:first:pl-0 xl:last:pr-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
