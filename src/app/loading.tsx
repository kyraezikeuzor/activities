export default function Loading() {
  return <div className="page-container py-12" role="status">
    <p className="text-sm text-muted-foreground">Loading…</p>
    <div aria-hidden className="mt-7 h-12 max-w-2xl rounded-full bg-muted" />
    <div aria-hidden className="mt-8 grid gap-6 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-48 rounded-xl bg-muted" />)}</div>
  </div>;
}
