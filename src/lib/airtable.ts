/**
 * Airtable client helpers for Activities.
 * Field names match the live base exactly — do not rename.
 */

import { buildClaimCreateFields, deriveEffectiveSignUps } from "@/lib/claims";

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
    params.set("filterByFormula", options?.filterByFormula || "TRUE()");

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
  "Linked Projects"?: string[];
  "Rollup Partner"?: string | string[];
  Track?: string;
  Category?: string;
  Type?: string;
  Description?: string;
  Location?: string;
  "Slots Max"?: number;
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
  projectName: string | null;
  projectThumbnailUrl: string | null;
  centerName: string | null;
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

export interface ProjectFields {
  "Project Name"?: string;
  Status?: string;
  "Linked Center"?: string[];
  Thumbnail?: AirtableAttachment[];
  "Project Description"?: string;
  "Project Summary"?: string;
  History?: string;
  "Impact Report"?: string;
  "Created By"?: string;
  "Linked Activities"?: string[];
  Supplies?: string[];
}

export interface Project {
  id: string;
  slug: string;
  createdTime: string;
  name: string;
  status: string | null;
  centerName: string | null;
  location: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  summary: string | null;
  activityCount: number;
}

export interface SupplyFields {
  "Supply Name"?: string;
  Project?: string[];
  Image?: AirtableAttachment[];
  Description?: string;
  Category?: string;
  "Quantity Needed"?: number;
  "Unit Cost"?: number;
  "Delivery Cost"?: number;
  "Amount Raised"?: number;
  "Quantity Sourced In-Kind"?: number;
  "Quantity Delivered"?: number;
  Status?: string;
  Supplier?: string;
  "Purchase Link"?: string;
  Notes?: string;
  "Supply ID"?: string;
  "Total Cost"?: number;
  "Sponsorship Price"?: number;
}

export interface Supply {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  category: string | null;
  quantityNeeded: number;
  quantityFunded: number;
  quantitySourcedInKind: number;
  quantityDelivered: number;
  unitCost: number;
  deliveryCost: number;
  amountRaised: number;
  sponsorshipPrice: number;
  totalCost: number;
  status: string | null;
  supplier: string | null;
  purchaseLink: string | null;
  isPlaceholder?: boolean;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  description: string;
  date: string | null;
  stage: "fundraising" | "purchased" | "shipped" | "delivered" | "completed";
}

export interface ProjectDetail extends Project {
  partnerDescription: string | null;
  partnerNeeds: string | null;
  history: string | null;
  impactReport: string | null;
  createdBy: string | null;
  supplies: Supply[];
  activities: Activity[];
  updates: ProjectUpdate[];
}

/** Build public path slug: `title-slug-{airtableRecordId}`. */
export function buildActivitySlug(title: string, recordId: string): string {
  const base = slugify(title) || "activity";
  return `${base}-${recordId}`;
}

/** Build a stable public project path while retaining the Airtable record id. */
export function buildProjectSlug(title: string, recordId: string): string {
  const base = slugify(title) || "project";
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

function asDisplayString(value: unknown): string | null {
  return asStringArray(value).join(", ") || null;
}

type LinkedProjectDetails = {
  name: string | null;
  thumbnailUrl: string | null;
};

type AirtableAttachment = {
  url?: string;
  thumbnails?: {
    large?: { url?: string };
    small?: { url?: string };
  };
};

export function mapActivityRecord(
  record: {
    id: string;
    createdTime: string;
    fields: ActivityFields;
  },
  linkedProjectsById: ReadonlyMap<string, LinkedProjectDetails> = new Map()
): Activity {
  const title =
    record.fields["Activity Name"]?.trim() || "Untitled Activity";
  const explicitSlug = record.fields.Slug?.trim();
  const slug = buildActivitySlug(
    explicitSlug || title,
    record.id
  );
  const signUpIds = asStringArray(record.fields["Linked Sign Ups"]);
  const linkedProjectIds = asStringArray(record.fields["Linked Projects"]);
  const projectName =
    linkedProjectIds
      .map((projectId) => {
        const resolvedName = linkedProjectsById.get(projectId)?.name;
        if (resolvedName) return resolvedName;
        return projectId.startsWith("rec") ? null : projectId;
      })
      .filter((name): name is string => !!name)
      .join(", ") || null;
  const projectThumbnailUrl =
    linkedProjectIds
      .map((projectId) => linkedProjectsById.get(projectId)?.thumbnailUrl)
      .find((url): url is string => !!url) || null;

  return {
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields,
    title,
    projectName,
    projectThumbnailUrl,
    centerName: asDisplayString(record.fields["Rollup Partner"]),
    category: record.fields.Track?.trim() || null,
    activityCategory: record.fields.Category?.trim() || null,
    type: record.fields.Type?.trim() || null,
    description: record.fields.Description?.trim() || null,
    location: record.fields.Location?.trim() || null,
    instructions: record.fields.Instructions?.trim() || null,
    slotsTotal:
      typeof record.fields["Slots Max"] === "number"
        ? record.fields["Slots Max"]
        : typeof record.fields["Slots Total"] === "number"
          ? record.fields["Slots Total"]
        : 0,
    // This legacy-only value is replaced by enrichActivityWithClaims before
    // an Activity is exposed to the UI. The raw rollup remains in fields.
    slotsFilled: new Set(signUpIds).size,
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

export function enrichActivityWithClaims(
  activity: Activity,
  claims: Claim[]
): Activity {
  const effective = deriveEffectiveSignUps(
    activity.id,
    asStringArray(activity.fields["Linked Sign Ups"]),
    claims
  );

  return {
    ...activity,
    slotsFilled: effective.slotsFilled,
    signUpIds: effective.personIds,
  };
}

export async function fetchAllActivities(): Promise<Activity[]> {
  const [records, claims, projects] = await Promise.all([
    listAllRecords<ActivityFields>("Activities"),
    fetchAllClaims(),
    listAllRecords<{
      "Project Name"?: string;
      Name?: string;
      Thumbnail?: AirtableAttachment[];
    }>("Projects"),
  ]);
  const linkedProjectsById = new Map(
    projects.map((project) => [
      project.id,
      {
        name:
          project.fields["Project Name"]?.trim() ||
          project.fields.Name?.trim() ||
          null,
        thumbnailUrl:
          project.fields.Thumbnail?.[0]?.thumbnails?.large?.url ||
          project.fields.Thumbnail?.[0]?.thumbnails?.small?.url ||
          project.fields.Thumbnail?.[0]?.url ||
          null,
      },
    ] as const)
  );

  return records
    .map((record) => mapActivityRecord(record, linkedProjectsById))
    .map((activity) => enrichActivityWithClaims(activity, claims));
}

export async function fetchAllProjects(): Promise<Project[]> {
  const [projects, centers] = await Promise.all([
    listAllRecords<ProjectFields>("Projects"),
    listAllRecords<{ Name?: string; Location?: string }>("Partners"),
  ]);
  const centersById = new Map(
    centers.flatMap((center) => {
      const name = center.fields.Name?.trim();
      return name
        ? [[center.id, { name, location: center.fields.Location?.trim() || null }] as const]
        : [];
    })
  );

  return projects.map((project) => {
    const fields = project.fields;
    const linkedCenters = asStringArray(fields["Linked Center"])
      .map((centerId) => centersById.get(centerId))
      .filter((center): center is { name: string; location: string | null } => !!center);
    const name = fields["Project Name"]?.trim() || "Untitled Project";

    return {
      id: project.id,
      slug: buildProjectSlug(name, project.id),
      createdTime: project.createdTime,
      name,
      status: fields.Status?.trim() || null,
      centerName: linkedCenters.map((center) => center.name).join(", ") || null,
      location:
        linkedCenters.map((center) => center.location).filter(Boolean).join(", ") ||
        null,
      thumbnailUrl:
        fields.Thumbnail?.[0]?.thumbnails?.large?.url ||
        fields.Thumbnail?.[0]?.url ||
        null,
      description: fields["Project Description"]?.trim() || null,
      summary: fields["Project Summary"]?.trim() || null,
      activityCount: asStringArray(fields["Linked Activities"]).length,
    };
  });
}

type PartnerFields = {
  Name?: string;
  Status?: string | string[];
  Thumbnail?: AirtableAttachment[];
  Location?: string;
  Description?: string;
  "Requested Needs"?: string;
};

export interface Partner {
  id: string;
  name: string;
  thumbnailUrl: string | null;
}

export async function fetchActivePartners(): Promise<Partner[]> {
  const records = await listAllRecords<PartnerFields>("Partners");
  return records
    .filter(({ fields }) => asStringArray(fields.Status).some((status) => status.trim().toLowerCase() === "active"))
    .map(({ id, fields }) => ({
      id,
      name: fields.Name?.trim() || "Community partner",
      thumbnailUrl: fields.Thumbnail?.[0]?.thumbnails?.small?.url || fields.Thumbnail?.[0]?.url || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mapSupplyRecord(record: {
  id: string;
  fields: SupplyFields;
}): Supply {
  const fields = record.fields;
  const quantityNeeded = Math.max(0, fields["Quantity Needed"] ?? 0);
  const unitCost = Math.max(0, fields["Unit Cost"] ?? 0);
  const deliveryCost = Math.max(0, fields["Delivery Cost"] ?? 0);
  const sponsorshipPrice = Math.max(
    0,
    fields["Sponsorship Price"] ?? unitCost + deliveryCost
  );
  const amountRaised = Math.max(0, fields["Amount Raised"] ?? 0);

  return {
    id: record.id,
    name: fields["Supply Name"]?.trim() || "Requested supply",
    imageUrl:
      fields.Image?.[0]?.thumbnails?.large?.url ||
      fields.Image?.[0]?.url ||
      null,
    description: fields.Description?.trim() || null,
    category: fields.Category?.trim() || null,
    quantityNeeded,
    quantityFunded:
      sponsorshipPrice > 0
        ? Math.min(quantityNeeded, Math.floor(amountRaised / sponsorshipPrice))
        : 0,
    quantitySourcedInKind: Math.max(
      0,
      fields["Quantity Sourced In-Kind"] ?? 0
    ),
    quantityDelivered: Math.max(0, fields["Quantity Delivered"] ?? 0),
    unitCost,
    deliveryCost,
    amountRaised,
    sponsorshipPrice,
    totalCost: Math.max(
      0,
      fields["Total Cost"] ?? sponsorshipPrice * quantityNeeded
    ),
    status: fields.Status?.trim() || null,
    supplier: fields.Supplier?.trim() || null,
    purchaseLink: fields["Purchase Link"]?.trim() || null,
  };
}

function supplyStage(status: string | null): ProjectUpdate["stage"] {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("deliver")) return "delivered";
  if (normalized.includes("ship")) return "shipped";
  if (normalized.includes("purchas")) return "purchased";
  if (normalized.includes("complete")) return "completed";
  return "fundraising";
}

/** Fetch one project and resolve its linked partner, supplies, and activities. */
export async function fetchProjectBySlug(
  slug: string
): Promise<ProjectDetail | null> {
  const [projectRecords, partnerRecords, supplyRecords, activityRecords, claims] =
    await Promise.all([
      listAllRecords<ProjectFields>("Projects"),
      listAllRecords<PartnerFields>("Partners"),
      listAllRecords<SupplyFields>("Supplies"),
      listAllRecords<ActivityFields>("Activities"),
      fetchAllClaims(),
    ]);

  const projectRecord = projectRecords.find((record) => {
    const name = record.fields["Project Name"]?.trim() || "Untitled Project";
    return (
      buildProjectSlug(name, record.id).toLowerCase() === slug.toLowerCase() ||
      record.id.toLowerCase() === slug.toLowerCase()
    );
  });
  if (!projectRecord) return null;

  const fields = projectRecord.fields;
  const name = fields["Project Name"]?.trim() || "Untitled Project";
  const partnerIds = asStringArray(fields["Linked Center"]);
  const partners = partnerRecords.filter((partner) => partnerIds.includes(partner.id));
  const supplies = supplyRecords
    .filter((supply) => asStringArray(supply.fields.Project).includes(projectRecord.id))
    .map(mapSupplyRecord);

  const linkedProjectsById = new Map<string, LinkedProjectDetails>([
    [
      projectRecord.id,
      {
        name,
        thumbnailUrl:
          fields.Thumbnail?.[0]?.thumbnails?.large?.url ||
          fields.Thumbnail?.[0]?.url ||
          null,
      },
    ],
  ]);
  const linkedActivityIds = new Set(asStringArray(fields["Linked Activities"]));
  const activities = activityRecords
    .filter(
      (activity) =>
        linkedActivityIds.has(activity.id) ||
        asStringArray(activity.fields["Linked Projects"]).includes(projectRecord.id)
    )
    .map((activity) => mapActivityRecord(activity, linkedProjectsById))
    .map((activity) => enrichActivityWithClaims(activity, claims));

  const updates: ProjectUpdate[] = supplies
    .filter((supply) => !!supply.status)
    .map((supply) => ({
      id: `supply-${supply.id}`,
      title: `${supply.name}: ${supply.status}`,
      description: `${supply.quantityDelivered} delivered of ${supply.quantityNeeded} requested.`,
      date: null,
      stage: supplyStage(supply.status),
    }));
  if (updates.length === 0) {
    const completed = fields.Status?.trim().toLowerCase() === "completed";
    updates.push({
      id: `project-${projectRecord.id}`,
      title: completed ? "Project completed" : "Fundraising is active",
      description:
        fields["Impact Report"]?.trim() ||
        fields.History?.trim() ||
        (completed
          ? "This project is marked completed in Omelora's project record."
          : "This project is currently accepting community support."),
      date: projectRecord.createdTime,
      stage: completed ? "completed" : "fundraising",
    });
  }

  return {
    id: projectRecord.id,
    slug: buildProjectSlug(name, projectRecord.id),
    createdTime: projectRecord.createdTime,
    name,
    status: fields.Status?.trim() || null,
    centerName:
      partners.map((partner) => partner.fields.Name?.trim()).filter(Boolean).join(", ") ||
      null,
    location:
      partners
        .map((partner) => partner.fields.Location?.trim())
        .filter(Boolean)
        .join(", ") || null,
    thumbnailUrl:
      fields.Thumbnail?.[0]?.thumbnails?.large?.url ||
      fields.Thumbnail?.[0]?.url ||
      null,
    description: fields["Project Description"]?.trim() || null,
    summary: fields["Project Summary"]?.trim() || null,
    activityCount: activities.length,
    partnerDescription:
      partners
        .map((partner) => partner.fields.Description?.trim())
        .filter(Boolean)
        .join("\n\n") || null,
    partnerNeeds:
      partners
        .map((partner) => partner.fields["Requested Needs"]?.trim())
        .filter(Boolean)
        .join("\n\n") || null,
    history: fields.History?.trim() || null,
    impactReport: fields["Impact Report"]?.trim() || null,
    createdBy: fields["Created By"]?.trim() || null,
    supplies,
    activities,
    updates,
  };
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

/** Resolve a Person directly from Airtable using a normalized email. */
export async function fetchPersonByEmail(email: string): Promise<Person | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const records = await listAllRecords<PersonFields>("People", {
    filterByFormula: `LOWER({Email})=LOWER('${escapeFormulaString(normalized)}')`,
  });
  return records[0] ? mapPersonRecord(records[0]) : null;
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

// ——— Claims ———

export type ClaimStatus =
  | "Claimed"
  | "In Progress"
  | "Pending Review"
  | "Completed"
  | "Cancelled";

export interface ClaimFields {
  Id?: number;
  "Linked Person"?: string[];
  "Linked Activity"?: string[];
  Status?: string;
  "Claimed Date"?: string;
  "Completed Date"?: string;
}

export interface Claim {
  id: string;
  createdTime: string;
  fields: ClaimFields;
  personId: string | null;
  activityId: string | null;
  status: string;
  claimedAt: string;
  completedAt: string | null;
}

export function mapClaimRecord(record: {
  id: string;
  createdTime: string;
  fields: ClaimFields;
}): Claim {
  return {
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields,
    personId: asStringArray(record.fields["Linked Person"])[0] ?? null,
    activityId: asStringArray(record.fields["Linked Activity"])[0] ?? null,
    status: record.fields.Status?.trim() || "Claimed",
    claimedAt: record.fields["Claimed Date"]?.trim() || record.createdTime,
    completedAt: record.fields["Completed Date"]?.trim() || null,
  };
}

export async function fetchAllClaims(): Promise<Claim[]> {
  const records = await listAllRecords<ClaimFields>("Claims");
  return records.map(mapClaimRecord);
}

export async function createClaim(input: {
  personId: string;
  activityId: string;
}): Promise<Claim> {
  const { apiKey, baseId } = getConfig();
  const res = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent("Claims")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: buildClaimCreateFields(input.personId, input.activityId),
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable Claims create failed (${res.status}): ${body}`);
  }

  return mapClaimRecord(
    (await res.json()) as {
      id: string;
      createdTime: string;
      fields: ClaimFields;
    }
  );
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus
): Promise<Claim> {
  const { apiKey, baseId } = getConfig();
  const res = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent("Claims")}/${claimId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { Status: status } }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable Claims update failed (${res.status}): ${body}`);
  }

  return mapClaimRecord(
    (await res.json()) as {
      id: string;
      createdTime: string;
      fields: ClaimFields;
    }
  );
}
