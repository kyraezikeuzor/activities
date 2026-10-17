import type { Activity, Partner } from "@/lib/airtable";


export function PartnersList({ partners }: { partners: Partner[] }) {
  return (
    <div>
      <h2>Partners</h2>
      {partners.length > 0 ? <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4" aria-label="Community partners">
        <div className=" flex min-w-0 flex-1 flex-wrap gap-2">
        {partners.map((partner) => <span key={partner.id} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">
            {partner.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.thumbnailUrl} alt="" loading="lazy" className="h-7 w-7 shrink-0 rounded-md object-cover" />
            ) : null}
            {partner.name}
        </span>)}
        </div>
        <p className="hidden shrink-0 whitespace-nowrap text-sm text-muted-foreground">{partners.length} {partners.length === 1 ? "partner" : "partners"}</p>
        </div> : null}
    </div>
  );
}