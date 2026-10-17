import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <main className="page-gutters flex min-h-screen items-center justify-center bg-white">
      <div className="max-w-md rounded-3xl border border-border bg-white p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-600">Project not found</p>
        <h1 className="mt-3 text-3xl font-bold">This project is not available.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">It may have moved or no longer be published.</p>
        <Link href="/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to projects
        </Link>
      </div>
    </main>
  );
}
