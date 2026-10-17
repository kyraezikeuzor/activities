export default function ProjectLoading() {
  return (
    <main className="page-container min-h-screen animate-pulse bg-white py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div className="min-h-80 rounded-3xl bg-orange-100" />
        <div className="space-y-5 py-4">
          <div className="h-6 w-32 rounded-full bg-muted" />
          <div className="h-14 w-full rounded-xl bg-muted" />
          <div className="h-6 w-2/3 rounded-lg bg-muted" />
          <div className="h-40 rounded-2xl bg-white" />
        </div>
      </div>
    </main>
  );
}
