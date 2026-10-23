import { unstable_cache } from "next/cache";
import { fetchAllProjects } from "@/lib/airtable";
import type { Initiative } from "@/components/ActivitiesBoard";

/** Active projects from Airtable, shown as the "Projects we support" row. Shared cache, refreshed every 5 minutes. */
export const getInitiatives = unstable_cache(
  async (): Promise<Initiative[]> => {
    const projects = await fetchAllProjects();
    return projects
      .filter((project) => project.status?.toLowerCase() === "active")
      .map((project) => ({ id: project.id, name: project.name, thumbnailUrl: project.thumbnailUrl }));
  },
  ["initiatives-v2"],
  { revalidate: 300, tags: ["projects"] }
);
