import { fetchAllActivities, type Activity } from "@/lib/airtable";

const CACHE_TTL_MS = 5 * 60 * 1000;

/** In-memory Activities cache keyed by lowercased slug (`title-slug-recXXXX`). */
const activitiesBySlug = new Map<string, Activity>();
/** Secondary index by Airtable record id for lookups from URL suffix. */
const activitiesById = new Map<string, Activity>();

let lastRefreshedAt: number | null = null;
let refreshInFlight: Promise<number> | null = null;

export function getActivitiesCacheStats() {
  return {
    size: activitiesBySlug.size,
    lastRefreshedAt,
    ageMs: lastRefreshedAt === null ? null : Date.now() - lastRefreshedAt,
    isStale: isCacheStale(),
  };
}

function isCacheStale(): boolean {
  if (lastRefreshedAt === null || activitiesBySlug.size === 0) return true;
  return Date.now() - lastRefreshedAt > CACHE_TTL_MS;
}

/**
 * Fetch ALL Activities records from Airtable and rebuild the slug cache.
 * Returns the number of cached records.
 */
export async function refreshActivitiesCache(): Promise<number> {
  // Coalesce concurrent refreshes into one Airtable pull
  if (refreshInFlight) {
    console.log("[activitiesCache] refresh already in flight — awaiting it");
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    console.log("[activitiesCache] refreshing Activities cache from Airtable…");
    const started = Date.now();
    const activities = await fetchAllActivities();

    activitiesBySlug.clear();
    activitiesById.clear();
    for (const activity of activities) {
      const key = activity.slug.trim().toLowerCase();
      if (!key) continue;
      activitiesBySlug.set(key, activity);
      activitiesById.set(activity.id, activity);
    }

    lastRefreshedAt = Date.now();
    const elapsed = lastRefreshedAt - started;
    console.log(
      `[activitiesCache] refresh complete — cached ${activitiesBySlug.size} activities (${elapsed}ms)`
    );
    return activitiesBySlug.size;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Return all Activities via the in-memory cache.
 * Refreshes from Airtable when the cache is empty or older than 5 minutes.
 */
export async function getActivities(): Promise<Activity[]> {
  if (isCacheStale()) {
    console.log(
      "[activitiesCache] cache miss/stale for getActivities — refreshing before lookup"
    );
    await refreshActivitiesCache();
  } else {
    console.log(
      "[activitiesCache] cache hit path for getActivities (no refresh needed)"
    );
  }

  return Array.from(activitiesBySlug.values());
}

/**
 * Look up an activity by public slug (`title-slug-recXXXX`).
 * Also resolves by trailing Airtable record id when the title portion drifts.
 * Refreshes from Airtable when the cache is empty or older than 5 minutes.
 */
export async function getActivityBySlug(
  slug: string
): Promise<Activity | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;

  if (isCacheStale()) {
    console.log(
      `[activitiesCache] cache miss/stale for "${key}" — refreshing before lookup`
    );
    await refreshActivitiesCache();
  } else {
    console.log(
      `[activitiesCache] cache hit path for "${key}" (no refresh needed)`
    );
  }

  let activity = activitiesBySlug.get(key) ?? null;

  // Fallback: match trailing Airtable record id (rec…)
  if (!activity) {
    const idMatch = key.match(/(rec[a-z0-9]+)$/i);
    if (idMatch) {
      activity = activitiesById.get(idMatch[1]) ?? null;
    }
  }

  if (activity) {
    console.log(`[activitiesCache] found "${key}" in cache`);
  } else {
    console.log(`[activitiesCache] "${key}" not found in cache`);
  }
  return activity;
}
