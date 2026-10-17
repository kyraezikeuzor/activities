"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, X } from "lucide-react";
import { CATEGORIES, CATEGORY_ICONS, type Category } from "@/lib/category";
import type { Activity } from "@/lib/airtable";
import { isBoardVisible, participationType } from "@/lib/activityBrowsing";
import { typography } from "@/styles/typography";
import { avatarColor } from "@/lib/avatar";

/** Up to 5 recent volunteers per activity, keyed by activity id. */
export type SignUpPreview = Record<string, { people: { id: string; initials: string }[]; total: number }>;

export type Initiative = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
};

function projectIds(activity: Activity): string[] {
  const ids = activity.fields["Linked Projects"];
  return Array.isArray(ids) ? ids : [];
}

function spotsLine(activity: Activity): string | null {
  if (activity.slotsTotal > 0) {
    return `${Math.min(activity.slotsFilled, activity.slotsTotal)} of ${activity.slotsTotal} spots filled`;
  }
  if (activity.slotsFilled > 0) return `${activity.slotsFilled} signed up`;
  return null;
}

function AvatarStack({ preview }: { preview?: SignUpPreview[string] }) {
  if (!preview || preview.people.length === 0) return null;
  const extra = preview.total - preview.people.length;
  return (
    <div className="mt-2.5 flex items-center" aria-label={`${preview.total} signed up`}>
      {preview.people.map((person) => (
        <span
          key={person.id}
          className={`-ml-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white first:ml-0 ${avatarColor(person.id)}`}
          aria-hidden
        >
          {person.initials}
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-semibold text-muted-foreground" aria-hidden>
          …
        </span>
      )}
    </div>
  );
}

function ActivityRow({ activity, preview }: { activity: Activity; preview?: SignUpPreview[string] }) {
  const meta = [spotsLine(activity), activity.hours > 0 ? `${activity.hours} ${activity.hours === 1 ? "hour" : "hours"}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={`/${activity.slug}`}
      className="group block border-b border-border px-2 py-3 transition-colors last:border-b-0 hover:bg-muted/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`${typography.cardTitle} text-foreground`}>{activity.title}</h3>
          {meta && <p className={`${typography.metadata} mt-0.5 text-muted-foreground`}>{meta}</p>}
          <AvatarStack preview={preview} />
        </div>
        <span className={`inline-flex h-8 shrink-0 items-center rounded-lg px-3 ${typography.button} ${typography.buttonPrimary}`}>
          View
        </span>
      </div>
      {activity.projectName && (
        <div className="mt-3 flex min-w-0 items-center gap-3 rounded-xl border-2 border-border bg-background p-2.5">
          {activity.projectThumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activity.projectThumbnailUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className={`${typography.helper} text-muted-foreground`}>Supports</p>
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{activity.projectName}</p>
          </div>
        </div>
      )}
    </Link>
  );
}

function CategoryColumn({ category, activities, previews }: { category: Category; activities: Activity[]; previews: SignUpPreview }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <section className="flex min-w-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-medium text-muted-foreground">{category}</h2>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
          {activities.length}
        </span>
      </div>
      <div className="flex flex-col pt-1">
        {activities.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">No activities</p>
        ) : (
          activities.map((activity) => <ActivityRow key={activity.id} activity={activity} preview={previews[activity.id]} />)
        )}
      </div>
    </section>
  );
}

function Segmented({ value, options, onChange, label }: { value: string; options: string[]; onChange: (value: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 rounded-lg border border-border bg-[#F8F8F8] p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`h-9 rounded-md px-3 ${typography.button} transition-colors ${value === option ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function ActivitiesBoard({ activities, initiatives, previews }: { activities: Activity[]; initiatives: Initiative[]; previews: SignUpPreview }) {
  const [query, setQuery] = useState("");
  const [participation, setParticipation] = useState("All");
  const [location, setLocation] = useState("");
  const [initiativeId, setInitiativeId] = useState<string | null>(null);
  const [mobileCategory, setMobileCategory] = useState<Category>(CATEGORIES[0]);

  const visible = useMemo(() => activities.filter(isBoardVisible), [activities]);
  const openCount = (id: string) => visible.filter((activity) => projectIds(activity).includes(id)).length;
  const shownInitiatives = initiatives.filter((initiative) => openCount(initiative.id) > 0);
  const locations = [...new Set(visible.filter((a) => participationType(a) === "In Person").map((a) => a.location?.trim()).filter((v): v is string => !!v))].sort();

  const search = query.trim().toLowerCase();
  const filtered = visible.filter((activity) => {
    const text = [activity.title, activity.projectName, activity.description, activity.location].filter(Boolean).join(" ").toLowerCase();
    return (!search || text.includes(search))
      && (participation === "All" || participationType(activity) === participation)
      && (!location || activity.location?.trim() === location)
      && (!initiativeId || projectIds(activity).includes(initiativeId));
  });
  const byCategory = CATEGORIES.map((category) => ({
    category,
    activities: filtered.filter((a) => a.category?.trim().toLowerCase() === category.toLowerCase()),
  }));
  const mobileColumn = byCategory.find((c) => c.category === mobileCategory) ?? byCategory[0];
  const selectedInitiative = initiatives.find((i) => i.id === initiativeId);
  const hasFilters = !!search || participation !== "All" || !!location || !!initiativeId;

  return (
    <div className="page-container pb-12 pt-6 sm:pt-8">
      <h2 id="activities-heading" className={`${typography.sectionTitle} mb-3 scroll-mt-6 text-foreground`}>Activities</h2>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-0 sm:w-72">
          <span className="sr-only">Search activities</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-bridge-action focus-visible:ring-2 focus-visible:ring-bridge-action/30"
          />
        </label>
        <Segmented
          label="Participation type"
          value={participation}
          options={["All", "Virtual", "In Person"]}
          onChange={(value) => { setParticipation(value); if (value !== "In Person") setLocation(""); }}
        />
        {participation === "In Person" && locations.length > 0 && (
          <label className="relative">
            <span className="sr-only">Location</span>
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none focus-visible:border-bridge-action"
            >
              <option value="">All locations</option>
              {locations.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        {selectedInitiative && (
          <button
            type="button"
            onClick={() => setInitiativeId(null)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 ${typography.button} ${typography.buttonActionQuiet}`}
          >
            <span className="max-w-[16rem] truncate">{selectedInitiative.name}</span>
            <X className="h-4 w-4 shrink-0" aria-label="Remove project filter" />
          </button>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQuery(""); setParticipation("All"); setLocation(""); setInitiativeId(null); }}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground sm:ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-4" role="tablist" aria-label="Activity categories">
          {byCategory.map(({ category, activities: list }) => {
            const selected = category === mobileCategory;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMobileCategory(category)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 ${typography.button} ${selected ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}
              >
                {category}
                <span className="text-xs opacity-70">{list.length}</span>
              </button>
            );
          })}
        </div>
        <CategoryColumn category={mobileColumn.category} activities={mobileColumn.activities} previews={previews} />
      </div>

      <div className="hidden gap-8 md:grid md:grid-cols-3">
        {byCategory.map(({ category, activities: list }) => (
          <CategoryColumn key={category} category={category} activities={list} previews={previews} />
        ))}
      </div>

      {/* Projects sit below Activities while there are only a few. */}
      {shownInitiatives.length > 0 && (
        <section aria-labelledby="initiatives-heading" className="mt-12">
          <h2 id="initiatives-heading" className={`${typography.sectionTitle} mb-3 text-foreground`}>Projects</h2>
          <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
            {shownInitiatives.map((initiative) => {
              const selected = initiative.id === initiativeId;
              const count = openCount(initiative.id);
              return (
                <button
                  key={initiative.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setInitiativeId(selected ? null : initiative.id);
                    // The filtered list is above the tiles, so bring it into view.
                    document.getElementById("activities-heading")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group w-56 shrink-0 snap-start text-left"
                >
                  <div className={`aspect-[3/2] overflow-hidden rounded-xl border bg-muted ${selected ? "border-bridge-action ring-2 ring-bridge-action" : "border-border"}`}>
                    {initiative.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={initiative.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <p className={`${typography.cardTitle} mt-2 line-clamp-2 text-foreground`}>{initiative.name}</p>
                  <p className={`${typography.helper} mt-0.5 text-muted-foreground`}>{count} open {count === 1 ? "activity" : "activities"}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
