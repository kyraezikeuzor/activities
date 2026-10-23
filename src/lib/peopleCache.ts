import { unstable_cache } from "next/cache";
import {
  fetchAllPeople,
  fetchPeopleByIds,
  type Person,
} from "@/lib/airtable";

const CACHE_TTL_MS = 5 * 60 * 1000;

/** In-memory People cache keyed by lowercased email. */
const peopleByEmail = new Map<string, Person>();
/** In-memory People cache keyed by Airtable record id. */
const peopleById = new Map<string, Person>();

let lastRefreshedAt: number | null = null;
let refreshInFlight: Promise<number> | null = null;

function isCacheStale(): boolean {
  if (lastRefreshedAt === null || peopleByEmail.size === 0) return true;
  return Date.now() - lastRefreshedAt > CACHE_TTL_MS;
}

function rememberPerson(person: Person): void {
  peopleById.set(person.id, person);
  const email = person.email?.trim().toLowerCase();
  if (email) peopleByEmail.set(email, person);
}

/**
 * Fetch ALL People records from Airtable and rebuild the caches.
 * Returns the number of cached records (by id).
 */
export async function refreshPeopleCache(): Promise<number> {
  if (refreshInFlight) {
    console.log("[peopleCache] refresh already in flight — awaiting it");
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    console.log("[peopleCache] refreshing People cache from Airtable…");
    const started = Date.now();
    const people = await fetchAllPeople();

    peopleByEmail.clear();
    peopleById.clear();
    for (const person of people) {
      rememberPerson(person);
    }

    lastRefreshedAt = Date.now();
    const elapsed = lastRefreshedAt - started;
    console.log(
      `[peopleCache] refresh complete — cached ${peopleById.size} people (${elapsed}ms)`
    );
    return peopleById.size;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Look up a person by email via the in-memory cache.
 * Refreshes from Airtable when the cache is empty or older than 5 minutes.
 */
export async function getPersonByEmail(
  email: string
): Promise<Person | null> {
  const key = email.trim().toLowerCase();
  if (!key) return null;

  if (isCacheStale()) {
    console.log(
      `[peopleCache] cache miss/stale for "${key}" — refreshing before lookup`
    );
    await refreshPeopleCache();
  } else {
    console.log(`[peopleCache] cache hit path for "${key}" (no refresh needed)`);
  }

  const person = peopleByEmail.get(key) ?? null;
  if (person) {
    console.log(`[peopleCache] found "${key}" in cache`);
  } else {
    console.log(`[peopleCache] "${key}" not found in cache`);
  }
  return person;
}

/**
 * Resolve People by Airtable record IDs (e.g. Linked Sign Ups).
 * Uses the in-memory id cache when warm; otherwise fetches only the
 * requested records (not the full People table).
 * Preserves input order; skips missing IDs.
 */
/**
 * Shared cache for avatar lookups, keyed by the sorted id list. A new server
 * reuses what another one fetched instead of asking Airtable again.
 */
const loadPeopleByIds = unstable_cache((ids: string[]) => fetchPeopleByIds(ids), ["people-by-ids-v2"], {
  revalidate: 3600,
  tags: ["people"],
});

export async function getPeopleByIds(ids: string[]): Promise<Person[]> {
  if (ids.length === 0) return [];

  const missing: string[] = [];
  for (const id of ids) {
    if (!peopleById.has(id)) missing.push(id);
  }

  if (missing.length === 0) {
    console.log(
      `[peopleCache] getPeopleByIds cache hit — ${ids.length} id(s)`
    );
  } else {
    console.log(
      `[peopleCache] getPeopleByIds fetching ${missing.length} missing id(s) (not full table)`
    );
    const started = Date.now();
    const fetched = await loadPeopleByIds([...new Set(missing)].sort());
    for (const person of fetched) {
      rememberPerson(person);
    }
    console.log(
      `[peopleCache] getPeopleByIds fetched ${fetched.length}/${missing.length} in ${Date.now() - started}ms`
    );
  }

  const people: Person[] = [];
  for (const id of ids) {
    const person = peopleById.get(id);
    if (person) people.push(person);
  }
  return people;
}
