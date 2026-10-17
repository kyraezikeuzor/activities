"use client";

import { useState } from "react";
import { LayoutGrid, MapPin } from "lucide-react";
import { SearchInput } from "@omelora/sunrise";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/category";
import { ActivityCard } from "@/components/ActivityCard";
import type { Activity, Partner } from "@/lib/airtable";
import { participationType } from "@/lib/activityBrowsing";
import HoursGuide from "@/components/HoursGuide";
import { BoardFilterBar } from "@/components/BoardFilterBar"

export function isBoardVisible(activity: Activity): boolean {
  // This older event was temporarily reopened only as a design reference.
  if (activity.id === "recv5yFmzQ4XkGCTx") return false;
  const status = activity.status?.trim().toLowerCase() ?? "";
  return status === "open" || status === "full" || status === "active";
}

export function ActivitiesBoard({ activities }: { activities: Activity[]; partners: Partner[] }) {
  const [category, setCategory] = useState("All Activities");
  const [participation, setParticipation] = useState("All");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const visible = activities.filter(isBoardVisible);
  const locations = [...new Set(visible.filter(a => participationType(a) === "In Person").map(a => a.location?.trim()).filter((value): value is string => !!value))].sort();
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = visible.filter(activity => {
    const searchable = [activity.title, activity.projectName, activity.description, activity.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (category === "All Activities" || activity.category?.trim().toLowerCase() === category.toLowerCase())
      && (participation === "All" || participationType(activity) === participation)
      && (!location || activity.location?.trim() === location);
  });
  const hasFilters = normalizedQuery !== "" || category !== "All Activities" || participation !== "All" || location !== "";
  function resetFilters() {
    setQuery(""); setCategory("All Activities"); setParticipation("All"); setLocation("");
  }

  return (
    <div className="page-container pb-12 pt-8 sm:pt-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Volunteer Activities</h1>
        <p hidden className="mt-2 text-sm text-muted-foreground">Put your time and talents toward projects that make a difference.</p>
      </div>

      <BoardFilterBar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search activities"
        categories={{
          label: "Activity categories",
          value: category,
          onChange: (value) => setCategory(value as typeof category),
          options: [
            { label: "All Activities", value: "All Activities", icon: LayoutGrid },
            ...CATEGORIES.map((value) => ({
              label: value,
              value,
              icon: CATEGORY_ICONS[value],
            })),
          ],
        }}
        secondaryFilter={{
          label: "Participation type",
          value: participation,
          onChange: (value) => {
            setParticipation(value);
            if (value === "Virtual") setLocation("");
          },
          options: [
            { label: "All", value: "All" },
            { label: "Virtual", value: "Virtual" },
            { label: "In Person", value: "In Person" },
          ],
        }}
        locationFilter={{
          value: location,
          onChange: (value) => {
            setLocation(value);
            if (value) setParticipation("In Person");
          },
          options: locations.map((value) => ({
            label: value,
            value,
          })),
        }}
      />



      <div className="flex min-h-14 items-center justify-between gap-4 text-xs text-muted-foreground">
        <p role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "activity" : "activities"}</p>
        {hasFilters && <button type="button" onClick={resetFilters} className="min-h-10 underline underline-offset-4 hover:text-foreground">Clear filters</button>}
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filtered.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
        </div>
      ) : (
        <div className="py-12 text-center">
          <h2 className="text-base font-semibold">{hasFilters ? "No matching activities" : "No open activities right now"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{hasFilters ? "Try another category or clear your filters." : "Check back soon for new ways to help."}</p>
        </div>
      )}
      <details className="mt-8 max-w-lg">
        <summary className="w-fit cursor-pointer text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">How volunteer hours work</summary>
        <div className="mt-3"><HoursGuide /></div>
      </details>
    </div>
  );
}
