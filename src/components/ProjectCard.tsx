import Link from "next/link";
import { Building2 } from "lucide-react";
import type { Project } from "@/lib/airtable";
import { Card } from "@omelora/sunrise";


export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className='border-2 !p-4'>
      <Link href={`/projects/${project.slug}`} className="group block">
        <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : <div className="flex h-full items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" aria-hidden /></div>}
        </div>
        <h2 className="mt-4 text-lg font-semibold leading-snug group-hover:underline underline-offset-4">{project.name}</h2>
        <p className="hidden mt-2 text-sm leading-6 text-foreground">{project.centerName}{project.location ? ` · ${project.location}` : ""}</p>
        <p className="mt-1 text-sm text-muted-foreground">{project.activityCount} {project.activityCount === 1 ? "activity" : "activities"}{project.status ? ` · ${project.status}` : ""}</p>
      </Link>
    </Card>
  );
}
