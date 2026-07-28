import { PageShell } from "@omelora/sunrise";
import { ActivitiesBoard } from "@/components/ActivitiesBoard";
import { getActivities } from "@/lib/activitiesCache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Omelora Volunteer Activities",
  description: "Browse open volunteer activities by track.",
};

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <PageShell constrain={false} className="bg-background">
      <ActivitiesBoard activities={activities} />
    </PageShell>
  );
}
