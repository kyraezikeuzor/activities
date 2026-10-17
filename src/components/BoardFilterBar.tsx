"use client";

import { MapPin, type LucideIcon } from "lucide-react";
import { SearchInput } from "@omelora/sunrise";
 
// Import SearchInput from its existing Sunrise UI location.

type FilterOption = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

type FilterGroup = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

type LocationFilter = {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
};

type BoardFilterBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder?: string;
  categories: FilterGroup;
  secondaryFilter?: FilterGroup;
  locationFilter?: LocationFilter;
  className?: string;
};

export function BoardFilterBar({
  query,
  onQueryChange,
  searchPlaceholder = "Search...",
  categories,
  secondaryFilter,
  locationFilter,
  className = "",
}: BoardFilterBarProps) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white px-3 py-3 ${className}`}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

        {/* Search */}
        <div className="min-w-0 xl:min-w-[190px] xl:flex-1">
          <label htmlFor="board-search" className="sr-only">
            {searchPlaceholder}
          </label>

          <SearchInput
            aria-label="Search activities, projects, or locations"
            id="board-search"
            value={query}
            onChange={(event:any) =>
              onQueryChange(event.target.value)
            }
            placeholder={searchPlaceholder}
            className="h-9 w-5 !rounded-3xl !pr-3 !py-2 border-0 bg-neutral-100 text-sm text-neutral-900 placeholder:text-neutral-400"
          />
        </div>

        {/* Categories */}
        <div className="shrink-0 xl:border-l xl:border-neutral-200 xl:pl-3">
        <div
            role="group"
            aria-label={categories.label}
            className="inline-flex h-10 items-center gap-0.5 rounded-lg bg-neutral-50 p-1"
        >
            {categories.options.map((option) => {
            const active = categories.value === option.value;
            const isAll = option.label === "All Activities";
            const Icon = isAll ? null : option.icon;

            return (
                <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => categories.onChange(option.value)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors ${
                    active
                    ? "bg-white border-2 border-neutral-100 text-neutral-900 ring-1 ring-neutral-200"
                    : "border-2 border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
                >
                {Icon && (
                    <Icon
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                    />
                )}
                {isAll ? "All" : option.label}
                </button>
            );
            })}
        </div>
        </div>


        {/* Optional secondary filter */}
        {secondaryFilter && (
          <div className="shrink-0 xl:border-l xl:border-neutral-200 xl:pl-3">
            <div
              role="group"
              aria-label={secondaryFilter.label}
              className="inline-flex h-10 items-center gap-0.5 rounded-lg bg-neutral-50 p-1"
            >
              {secondaryFilter.options.map((option) => {
                const active =
                  secondaryFilter.value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      secondaryFilter.onChange(option.value)
                    }
                    className={`h-8 shrink-0 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-white border-2 border-neutral-100 text-neutral-900 ring-1 ring-neutral-200"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional location filter */}
        {locationFilter && (
          <div className="shrink-0 xl:border-l xl:border-neutral-200 xl:pl-3">
            <label htmlFor="board-location" className="sr-only">
              Filter by location
            </label>

            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />

              <select
                id="board-location"
                value={locationFilter.value}
                onChange={(event) =>
                  locationFilter.onChange(event.target.value)
                }
                className="h-10 w-full min-w-[145px] rounded-lg border-2 border-neutral-200 bg-white pl-9 pr-7  text-xs font-medium text-neutral-700 outline-none hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200"
              >
                <option value="">
                  {locationFilter.placeholder ?? "All locations"}
                </option>

                {locationFilter.options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
