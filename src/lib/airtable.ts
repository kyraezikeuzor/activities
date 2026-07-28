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
  Type?: string;
  Description?: string;
  Location?: string;
  "Slots Total"?: number;
  "Slots Filled"?: number;
  Status?: string;
  "Fillout Link"?: string;
  "Start Date"?: string;
  "End Date"?: string;
  "Hours Value"?: number;
  Slug?: string;
  Languages?: string[];
  Instructions?: string;
  "Activity ID"?: number;
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
  category: string | null;
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
}

/** Build public path slug: `title-slug-{airtableRecordId}`. */
export function buildActivitySlug(title: string, recordId: string): string {
  const base = slugify(title) || "activity";
  return `${base}-${recordId}`;
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

  return {
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields,
    title,
    category: record.fields.Track?.trim() || null,
    type: record.fields.Type?.trim() || null,
    description: record.fields.Description?.trim() || null,
    location: record.fields.Location?.trim() || null,
    instructions: record.fields.Instructions?.trim() || null,
    slotsTotal:
      typeof record.fields["Slots Total"] === "number"
        ? record.fields["Slots Total"]
        : 0,
    slotsFilled:
      typeof record.fields["Slots Filled"] === "number"
        ? record.fields["Slots Filled"]
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
  };
}

export async function fetchAllActivities(): Promise<Activity[]> {
  const records = await listAllRecords<ActivityFields>("Activities");
  return records.map(mapActivityRecord);
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

