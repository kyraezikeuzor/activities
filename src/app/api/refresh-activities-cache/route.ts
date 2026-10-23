import { NextResponse } from "next/server";
import {
  getActivitiesCacheStats,
  refreshActivitiesCache,
} from "@/lib/activitiesCache";

export const dynamic = "force-dynamic";

/**
 * Mark the shared Activities cache stale so it refreshes from Airtable.
 * POST /api/refresh-activities-cache
 */
export async function POST() {
  try {
    const size = await refreshActivitiesCache();
    return NextResponse.json({
      ok: true,
      cached: size,
      ...getActivitiesCacheStats(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
