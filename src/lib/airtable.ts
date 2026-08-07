/**
 * Airtable client helpers for Activities.
 * Field names match the live base exactly — do not rename.
 */

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function getConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error(
      "Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables"
    );
  }
  return { apiKey, baseId };
}

type AirtableListResponse<TFields> = {
  records: Array<{
    id: string;
    createdTime: string;
    fields: TFields;
  }>;
  offset?: string;
};

async function listAllRecords<TFields>(
  table: string,
  options?: { filterByFormula?: string }
): Promise<Array<{ id: string; createdTime: string; fields: TFields }>> {
  const { apiKey, baseId } = getConfig();
  const records: Array<{ id: string; createdTime: string; fields: TFields }> =
    [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    if (options?.filterByFormula) {
      params.set("filterByFormula", options.filterByFormula);
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}?${params}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable ${table} list failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as AirtableListResponse<TFields>;
    for (const record of data.records ?? []) {
      records.push(record);
    }
    offset = data.offset;
  } while (offset);

  return records;
}

function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ——— Activities ———

export interface ActivityFields {
  "Activity Name"?: string;
  Track?: string;
  Category?: string;
  Type?: string;
  Description?: string;
  Location?: string;
  "Slots Total"?: number;
  "Slots Filled"?: number | string;
  Status?: string;
  "Fillout Link"?: string;
  "Start Date"?: string;
  "End Date"?: string;
  "Hours Value"?: number;
  Slug?: string;
  Languages?: string[];
  Instructions?: string;
  "Activity ID"?: number;
  "Linked Sign Ups"?: string[];
  "Submission Format"?: string;
}

/**
 * Normalized activity shape returned to the app.
 * Maps live Airtable fields → Title, Category, Claim Form URL, Hours, Slug, etc.
 */
export interface Activity {
  id: string;
  createdTime: string;
  fields: ActivityFields;
  title: string;
  /** Track for board columns (Education, Fundraising, …). */
  category: string | null;
  /** Airtable Category (e.g. Coloring Pages) — card metadata. */
  activityCategory: string | null;
  type: string | null;
  description: string | null;
  location: string | null;
  instructions: string | null;
  slotsTotal: number;
  slotsFilled: number;
  status: string | null;
  claimFormUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  hours: number;
  slug: string;
  signUpIds: string[];
  /** Airtable "Submission Format" — typically "text" or "attachment". */
  submissionFormat: string | null;
}

/** Build public path slug: `title-slug-{airtableRecordId}`. */
export function buildActivitySlug(title: string, recordId: string): string {
  const base = slugify(title) || "activity";
  return `${base}-${recordId}`;
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && !!v.trim());
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export function mapActivityRecord(record: {
  id: string;
  createdTime: string;
  fields: ActivityFields;
}): Activity {
  const title =
    record.fields["Activity Name"]?.trim() || "Untitled Activity";
  const explicitSlug = record.fields.Slug?.trim();
  const slug = buildActivitySlug(
    explicitSlug || title,
    record.id
  );
  const signUpIds = asStringArray(record.fields["Linked Sign Ups"]);
  const slotsFilledRaw = record.fields["Slots Filled"];
  // Prefer Airtable rollup; coerce string numbers if the API returns them that way
  const slotsFilledFromRollup =
    typeof slotsFilledRaw === "number"
      ? slotsFilledRaw
      : typeof slotsFilledRaw === "string" && slotsFilledRaw.trim() !== ""
        ? Number(slotsFilledRaw)
        : NaN;

  return {
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields,
    title,
    category: record.fields.Track?.trim() || null,
    activityCategory: record.fields.Category?.trim() || null,
    type: record.fields.Type?.trim() || null,
    description: record.fields.Description?.trim() || null,
    location: record.fields.Location?.trim() || null,
    instructions: record.fields.Instructions?.trim() || null,
    slotsTotal:
      typeof record.fields["Slots Total"] === "number"
        ? record.fields["Slots Total"]
        : 0,
    slotsFilled: Number.isFinite(slotsFilledFromRollup)
      ? slotsFilledFromRollup
      : 0,
    status: record.fields.Status?.trim() || null,
    claimFormUrl: record.fields["Fillout Link"]?.trim() || null,
    startDate: record.fields["Start Date"]?.trim() || null,
    endDate: record.fields["End Date"]?.trim() || null,
    hours:
      typeof record.fields["Hours Value"] === "number"
        ? record.fields["Hours Value"]
        : 0,
    slug,
    signUpIds,
    submissionFormat: record.fields["Submission Format"]?.trim() || null,
  };
}

export async function fetchAllActivities(): Promise<Activity[]> {
  const records = await listAllRecords<ActivityFields>("Activities");
  return records.map(mapActivityRecord);
}

export async function getActivityRecordById(
  activityId: string
): Promise<{
  id: string;
  createdTime: string;
  fields: ActivityFields;
} | null> {
  const { apiKey, baseId } = getConfig();
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent("Activities")}/${activityId}`;

  console.log("[airtable] GET Activity record", {
    method: "GET",
    table: "Activities",
    recordId: activityId,
    url,
  });

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const bodyText = await res.text();
  console.log("[airtable] GET Activity response", {
    status: res.status,
    ok: res.ok,
    body: bodyText,
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `Airtable Activities get failed (${res.status}): ${bodyText}`
    );
  }

  return JSON.parse(bodyText) as {
    id: string;
    createdTime: string;
    fields: ActivityFields;
  };
}

/**
 * Append a Person record ID to Activities."Linked Sign Ups" (linked-record array).
 * Fetches current links first, then PATCHes the full updated array.
 */
export async function addPersonToActivitySignUps(
  activityId: string,
  personId: string
): Promise<Activity> {
  console.log("[airtable] addPersonToActivitySignUps start", {
    activityId,
    personId,
  });

  const current = await getActivityRecordById(activityId);
  if (!current) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  const existing = asStringArray(current.fields["Linked Sign Ups"]);
  console.log("[airtable] current Linked Sign Ups", {
    activityId,
    existing,
    count: existing.length,
  });

  if (existing.includes(personId)) {
    console.log(
      "[airtable] person already in Linked Sign Ups — returning without PATCH",
      { activityId, personId }
    );
    return mapActivityRecord(current);
  }

  const nextSignUps = [...existing, personId];
  const { apiKey, baseId } = getConfig();
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent("Activities")}/${activityId}`;
  const payload = {
    fields: {
      "Linked Sign Ups": nextSignUps,
    },
  };

  console.log("[airtable] PATCH Activity Linked Sign Ups", {
    method: "PATCH",
    table: "Activities",
    recordId: activityId,
    field: "Linked Sign Ups",
    newValue: nextSignUps,
    url,
    payload,
  });

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const bodyText = await res.text();
  let parsed: unknown = bodyText;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    // keep raw text
  }

  console.log("[airtable] PATCH Activity response", {
    status: res.status,
    ok: res.ok,
    body: parsed,
  });

  if (!res.ok) {
    console.error("[airtable] PATCH Activity Linked Sign Ups FAILED", {
      status: res.status,
      body: parsed,
      activityId,
      personId,
    });
    throw new Error(
      `Airtable Activities update failed (${res.status}): ${bodyText}`
    );
  }

  // Rollups like "Slots Filled" are often stale/missing on PATCH responses —
  // re-GET so we always return the live Airtable rollup value.
  const fresh = await getActivityRecordById(activityId);
  if (!fresh) {
    console.warn(
      "[airtable] re-GET after PATCH returned null — falling back to PATCH body"
    );
    const updated = parsed as {
      id: string;
      createdTime: string;
      fields: ActivityFields;
    };
    return mapActivityRecord(updated);
  }

  console.log("[airtable] re-GET after PATCH — Slots Filled rollup", {
    activityId,
    slotsFilled: fresh.fields["Slots Filled"],
    linkedSignUps: fresh.fields["Linked Sign Ups"],
  });

  return mapActivityRecord(fresh);
}

// ——— People ———

export interface PersonFields {
  Email?: string;
  "First Name"?: string;
  "Last Name"?: string;
  Status?: string;
}

export interface Person {
  id: string;
  createdTime: string;
  fields: PersonFields;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  displayName: string;
  initials: string;
}

export function mapPersonRecord(record: {
  id: string;
  createdTime: string;
  fields: PersonFields;
}): Person {
  const firstName = record.fields["First Name"]?.trim() || null;
  const lastName = record.fields["Last Name"]?.trim() || null;
  const email = record.fields.Email?.trim() || null;
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || email || "Volunteer";
  const initials = (
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}` ||
    email?.[0] ||
    "?"
  ).toUpperCase();

  return {
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields,
    firstName,
    lastName,
    email,
    displayName,
    initials,
  };
}

export async function fetchAllPeople(): Promise<Person[]> {
  const records = await listAllRecords<PersonFields>("People");
  return records.map(mapPersonRecord);
}

/** Fetch a single People record by Airtable record id. */
export async function fetchPersonById(id: string): Promise<Person | null> {
  const { apiKey, baseId } = getConfig();
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent("People")}/${id}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable People get failed (${res.status}): ${body}`);
  }

  const record = (await res.json()) as {
    id: string;
    createdTime: string;
    fields: PersonFields;
  };
  return mapPersonRecord(record);
}

/** Fetch multiple People records by id in parallel (skips missing). */
export async function fetchPeopleByIds(ids: string[]): Promise<Person[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const results = await Promise.all(unique.map((id) => fetchPersonById(id)));
  const byId = new Map(
    results.filter((p): p is Person => p !== null).map((p) => [p.id, p])
  );

  // Preserve caller order; skip ids that 404'd
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Person => p !== undefined);
}

