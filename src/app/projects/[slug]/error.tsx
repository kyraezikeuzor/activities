"use client";

import Link from "next/link";

export default function ProjectError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <main className="page-gutters flex min-h-screen items-center justify-center bg-white">
      <div className="max-w-md rounded-3xl border border-border bg-white p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-600">Unable to load project</p>
        <h1 className="mt-3 text-3xl font-bold">The project data could not be loaded.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">Please try again. Your cart has not been charged or submitted.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => unstable_retry()} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">Try again</button>
          <Link href="/projects" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted">Projects</Link>
        </div>
      </div>
    </main>
  );
}
