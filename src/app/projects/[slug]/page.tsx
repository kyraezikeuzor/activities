import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ArrowRight } from "lucide-react";
import { ProjectDonationCart } from "@/components/ProjectDonationCart";
import { PageHeader } from "@/components/PageHeader";
import { ShareButton } from "@/components/ShareButton";
import { fetchProjectBySlug } from "@/lib/airtable";
import { VOLUNTEER_EMAIL } from "@/lib/format";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  return project ? { title: `${project.name} · Omelora`, description: project.description || project.summary || undefined } : { title: "Project not found · Omelora" };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) notFound();
  const completed = project.status?.toLowerCase() === "completed";
  const raised = project.supplies.reduce((sum, supply) => sum + supply.amountRaised, 0);
  const goal = project.supplies.reduce((sum, supply) => sum + supply.totalCost, 0);
  const progress = goal > 0 ? Math.min(100, Math.round(raised / goal * 100)) : 0;
  const delivered = project.supplies.reduce((sum, supply) => sum + supply.quantityDelivered, 0);
  const description = project.description || project.summary;
  const story = project.partnerDescription || project.history;
  const activities = project.activities.filter((activity) => ["open", "active", "full"].includes(activity.status?.toLowerCase() || ""));

  return <div className="min-h-screen bg-white text-foreground">
    <PageHeader active="projects" />
    <main className="page-container pb-28 pt-7 lg:pb-16">
      <Link href="/projects" className="inline-flex min-h-11 items-center gap-2 text-sm hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />All projects</Link>
      <h1 className="mb-7 mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{project.name}</h1>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div>
          <div className="aspect-[3/2] overflow-hidden rounded-xl bg-muted">
            {project.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.thumbnailUrl} alt={project.name} className="h-full w-full object-cover" />
            ) : <div className="flex h-full items-center justify-center"><Building2 className="h-12 w-12 text-muted-foreground" aria-hidden /></div>}
          </div>
          <div className="border-b border-border py-5 text-sm">{project.centerName}{project.location ? ` · ${project.location}` : ""}</div>
          <div className="space-y-5 py-7 text-base leading-7">
            {description ? <p className="whitespace-pre-line">{description}</p> : null}
            {story && story !== description ? <p className="whitespace-pre-line">{story}</p> : null}
            {project.partnerNeeds ? <p className="whitespace-pre-line">{project.partnerNeeds}</p> : null}
          </div>
          {project.centerName ? <div className="border-t border-border py-6">
            <h2 className="mb-3 text-lg font-semibold">Community partner</h2>
            <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Building2 className="h-4 w-4" aria-hidden />{project.centerName}</span>
          </div> : null}
        </div>
        <aside className="rounded-xl border border-border p-5 lg:sticky lg:top-6">
          {goal > 0 ? <>
            <p className="text-2xl font-semibold">{money(raised)} <span className="text-base font-normal">raised</span></p>
            <p className="mt-1 text-sm text-muted-foreground">of {money(goal)} goal</p>
            <div className="my-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Project funding" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
          </> : <h2 className="text-xl font-semibold">Support this project</h2>}
          {project.status ? <p className="mt-2 text-sm">{project.status}{delivered > 0 ? ` · ${delivered} supplies delivered` : ""}</p> : null}
          <a href="#donations" className="mb-3 mt-5 flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-sunrise-600">{completed ? "View project supplies" : "Donate supplies"}</a>
          <ShareButton title={project.name} />
        </aside>
      </div>

      <section id="donations" className="scroll-mt-6 border-t border-border py-8">
        <h2 className="text-xl font-semibold">Donations</h2>
        <p className="mb-6 mt-2 text-base leading-7">Help provide the supplies this community needs.</p>
        {project.supplies.length ? <ProjectDonationCart projectName={project.name} supplies={project.supplies} completed={completed} /> : <p className="rounded-xl bg-muted p-6 text-sm">Supply details are being prepared. Check back soon.</p>}
        <p className="mt-5 text-sm leading-6">Have supplies to offer? <a className="underline underline-offset-4" href={`mailto:${VOLUNTEER_EMAIL}?subject=${encodeURIComponent(`Supplies for ${project.name}`)}`}>Contact Omelora</a>.</p>
      </section>

      <section className="border-t border-border py-8">
        <h2 className="text-xl font-semibold">How support works</h2>
        <ol className="mt-5 grid gap-5 text-sm leading-6 sm:grid-cols-3">
          <li><span className="font-semibold">1. Choose supplies</span><p>Select the items you would like to contribute.</p></li>
          <li><span className="font-semibold">2. Coordinate with Omelora</span><p>We confirm your contribution and arrange the next steps.</p></li>
          <li><span className="font-semibold">3. Follow the progress</span><p>Return here for project and delivery updates.</p></li>
        </ol>
      </section>

      {activities.length ? <section className="border-t border-border py-8">
        <h2 className="text-xl font-semibold">Volunteer opportunities</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {activities.map((activity) => <Link key={activity.id} href={`/${activity.slug}`} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 hover:bg-muted">
            <div>{activity.category ? <p className="mb-2 text-xs">{activity.category}</p> : null}<h3 className="text-sm font-semibold">{activity.title}</h3><p className="mt-1 text-xs text-muted-foreground">{activity.slotsFilled} of {activity.slotsTotal} spots filled</p></div><ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>)}
        </div>
      </section> : null}

      {project.updates.length ? <section className="border-t border-border py-8">
        <h2 className="text-xl font-semibold">Updates</h2>
        <div className="mt-5 max-w-3xl divide-y divide-border">
          {project.updates.map((update) => <article key={update.id} className="py-5 first:pt-0">
            <h3 className="font-semibold">{update.title}</h3>
            {update.date ? <p className="mt-1 text-xs text-muted-foreground">{new Date(update.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</p> : null}
            <p className="mt-3 text-sm leading-6">{update.description}</p>
          </article>)}
        </div>
      </section> : null}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="page-container flex items-center gap-4">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{goal > 0 ? `${money(raised)} raised` : project.name}</p>
          <a href="#donations" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">{completed ? "View supplies" : "Donate supplies"}</a>
          <ShareButton title={project.name} />
        </div>
      </div>
    </main>
  </div>;
}
