import { revalidateTag, unstable_cache } from "next/cache";
import { fetchAllActivities, type Activity } from "@/lib/airtable";

/**
 * Activities live in Next's shared Data Cache, not in one server's memory.
 * Every Vercel instance reads the same copy, so a fresh instance doesn't
 * start empty. After 5 minutes the copy is served stale while it refreshes
 * in the background, so no visitor waits on Airtable for a routine refresh.
 */
export const ACTIVITIES_TAG = "activities";
const REVALIDATE_SECONDS = 300;

const loadActivities = unstable_cache(fetchAllActivities, ["activities-v2"], {
  revalidate: REVALIDATE_SECONDS,
  tags: [ACTIVITIES_TAG],
});

/**
 * Sign-ups made on this instance, shown right away while the shared copy
 * refreshes in the background. An entry is dropped once the shared copy
 * catches up or after a few minutes.
 */
const OVERRIDE_TTL_MS = 5 * 60 * 1000;
const overrides = new Map<string, { activity: Activity; at: number }>();

function applyOverrides(activities: Activity[]): Activity[] {
  if (overrides.size === 0) return activities;
  const now = Date.now();
  return activities.map((activity) => {
    const override = overrides.get(activity.id);
    if (!override) return activity;
    const caughtUp = activity.slotsFilled === override.activity.slotsFilled && activity.signUpIds.join() === override.activity.signUpIds.join();
    if (caughtUp || now - override.at > OVERRIDE_TTL_MS) {
      overrides.delete(activity.id);
      return activity;
    }
    // A sign-up record has no project names attached; keep the cached ones.
    return {
      ...override.activity,
      projectName: override.activity.projectName ?? activity.projectName,
      projectThumbnailUrl: override.activity.projectThumbnailUrl ?? activity.projectThumbnailUrl,
      centerName: override.activity.centerName ?? activity.centerName,
    };
  });
}

/** Return all Activities from the shared cache. */
export async function getActivities(): Promise<Activity[]> {
  return applyOverrides(await loadActivities());
}

/**
 * Look up an activity by public slug (`title-slug-recXXXX`).
 * Also resolves by trailing Airtable record id when the title portion drifts.
 */
export async function getActivityBySlug(slug: string): Promise<Activity | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const activities = await getActivities();
  const bySlug = activities.find((activity) => activity.slug.trim().toLowerCase() === key);
  if (bySlug) return bySlug;
  const id = key.match(/(rec[a-z0-9]+)$/i)?.[1];
  return id ? activities.find((activity) => activity.id.toLowerCase() === id.toLowerCase()) ?? null : null;
}

/**
 * After a sign-up: show the new count on this instance now, and mark the
 * shared copy stale so every instance picks it up on the next refresh.
 */
export function upsertActivityInCache(activity: Activity): void {
  overrides.set(activity.id, { at: Date.now(), activity });
  revalidateTag(ACTIVITIES_TAG, "max");
}

/** Mark the shared copy stale. The next request triggers a background refresh. */
export async function refreshActivitiesCache(): Promise<number> {
  revalidateTag(ACTIVITIES_TAG, "max");
  return (await loadActivities()).length;
}

export function getActivitiesCacheStats() {
  return { pendingOverrides: overrides.size, revalidateSeconds: REVALIDATE_SECONDS };
}
