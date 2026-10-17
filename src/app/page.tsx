import { PageShell } from "@omelora/sunrise";
import { ActivitiesBoard, type SignUpPreview } from "@/components/ActivitiesBoard";
import { isBoardVisible } from "@/lib/activityBrowsing";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getActivities } from "@/lib/activitiesCache";
import { getInitiatives } from "@/lib/initiatives";
import { getPeopleByIds } from "@/lib/peopleCache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Volunteer Activities | Omelora",
  description: "Browse open volunteer activities by track.",
};

export default async function HomePage() {
  const [activities, initiatives] = await Promise.all([
    getActivities(),
    getInitiatives().catch(() => []),
  ]);

  // Show up to 5 recent volunteers on each card so the board feels alive.
  const visible = activities.filter(isBoardVisible);
  const people = await getPeopleByIds([...new Set(visible.flatMap((a) => a.signUpIds.slice(0, 5)))]).catch(() => []);
  const initialsById = new Map(people.map((person) => [person.id, person.initials]));
  const previews: SignUpPreview = Object.fromEntries(
    visible.map((a) => [
      a.id,
      {
        people: a.signUpIds.slice(0, 5).flatMap((id) => {
          const initials = initialsById.get(id);
          return initials ? [{ id, initials }] : [];
        }),
        total: a.slotsFilled,
      },
    ])
  );

  return (
    <PageShell constrain={false} header={<SiteHeader />} className="bg-background">
      <ActivitiesBoard activities={activities} initiatives={initiatives} previews={previews} />
      <SiteFooter />
    </PageShell>
  );
}
