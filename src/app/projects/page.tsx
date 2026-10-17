import { PageShell } from "@omelora/sunrise";
import { PageHeader } from "@/components/PageHeader";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { fetchAllProjects } from "@/lib/airtable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects | Omelora", description: "Explore Omelora projects and community partners." };

export default async function ProjectsPage() {
  const projects = await fetchAllProjects();
  return <PageShell constrain={false} header={<PageHeader active="projects" />}>
    <div className="page-container py-10 sm:py-12">
      <ProjectsBoard projects={projects} />
    </div>
  </PageShell>;
}
