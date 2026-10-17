import { PageShell } from "@omelora/sunrise";
import { ActivitiesBoard } from "@/components/ActivitiesBoard";
import { PageHeader } from "@/components/PageHeader";
import { getActivities } from "@/lib/activitiesCache";
import { fetchActivePartners } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Volunteer Activities | Omelora",
  description: "Browse open volunteer activities by track.",
};

export default async function ActivitiesPage() {
  const [activities, partners] = await Promise.all([getActivities(), fetchActivePartners()]);

  return (
    <PageShell constrain={false} header={<PageHeader active="activities" />} className="bg-background">
      <ActivitiesBoard activities={activities} partners={partners} />
    </PageShell>
  );
}
