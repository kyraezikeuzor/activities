import type { Activity } from "@/lib/airtable";

export function participationType(activity: Pick<Activity, "type" | "location">): "Virtual" | "In Person" | null {
  const type = activity.type?.trim().toLowerCase() ?? "";
  const location = activity.location?.trim().toLowerCase() ?? "";
  if (/\b(remote|virtual|online)\b/.test(type) || /\b(remote|virtual|online|anywhere)\b/.test(location)) return "Virtual";
  if (/\bin[ -]person\b/.test(type)) return "In Person";
  if (location && !/^(tbd|tba|n\/a|to be announced|to be determined)$/.test(location)) return "In Person";
  return null;
}
