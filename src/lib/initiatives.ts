import { fetchAllProjects } from "@/lib/airtable";
import type { Initiative } from "@/components/ActivitiesBoard";

const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; value: Initiative[] } | null = null;

/** Active projects from Airtable, shown as the "Projects we support" row. */
export async function getInitiatives(): Promise<Initiative[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const projects = await fetchAllProjects();
  const value = projects
    .filter((project) => project.status?.toLowerCase() === "active")
    .map((project) => ({ id: project.id, name: project.name, thumbnailUrl: project.thumbnailUrl }));
  cached = { at: Date.now(), value };
  return value;
}
