import {
  BookOpen,
  Package,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  "Education",
  "Fundraising",
  "Programs",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Education: BookOpen,
  Fundraising: Tag,
  Programs: Users,
};

/** Solid colors for badges + card banner strips. */
export const CATEGORY_COLORS: Record<
  string,
  { badge: string; banner: string; icon: LucideIcon }
> = {
  education: {
    badge: "bg-sky-500 text-white",
    banner: "bg-sky-500",
    icon: BookOpen,
  },
  fundraising: {
    badge: "bg-green-500 text-white",
    banner: "bg-green-500",
    icon: Tag,
  },
  programs: {
    badge: "bg-navy-700 text-white",
    banner: "bg-navy-700",
    icon: Users,
  },
  supplies: {
    badge: "bg-sunrise-600 text-white",
    banner: "bg-sunrise-600",
    icon: Package,
  },
};

const FALLBACK = {
  badge: "bg-sky-500 text-white",
  banner: "bg-sky-500",
  icon: BookOpen as LucideIcon,
};

export function getCategoryStyle(category: string | null | undefined) {
  if (!category) return FALLBACK;
  return CATEGORY_COLORS[category.trim().toLowerCase()] ?? FALLBACK;
}

/** Privacy-friendly name: "Jordan L." */
export function formatShortName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.trim() || "Volunteer";
  const initial = lastName?.trim()?.[0];
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}
