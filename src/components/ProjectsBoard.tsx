"use client";

import { useState } from "react";
import { SearchInput } from "@omelora/sunrise";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/airtable";


export function ProjectsBoard({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const locations = [...new Set(projects.map((project) => project.location).filter((value): value is string => !!value))].sort();
  const visible = projects.filter((project) => (!location || project.location === location) && [project.name, project.centerName, project.location].some((value) => value?.toLowerCase().includes(query.trim().toLowerCase())));
  return <>
    <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-center">
      <label htmlFor="project-location" className="shrink-0 font-semibold">View projects by:</label>
      <select id="project-location" value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 rounded-full border border-border bg-white px-4 text-sm sm:min-w-48">
        <option value="">All locations</option>
        {locations.map((value) => <option key={value}>{value}</option>)}
      </select>
      <div className="relative flex-1">
        <SearchInput aria-label="Search projects" placeholder="Search projects or partners" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
    </div>
    <p className="sr-only" role="status">{visible.length} projects</p>
    {visible.length ? <div className="grid gap-x-2 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <p className="py-12 text-center text-foreground">{projects.length ? "No projects match your search. Try another name or location." : "New projects will appear here soon."}</p>}
  </>;
}
