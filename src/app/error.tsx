"use client";

export default function ErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return <div className="page-gutters mx-auto max-w-xl py-20 text-center">
    <h1 className="text-2xl font-semibold">We couldn’t load this page</h1>
    <p className="mt-3 leading-7">Please try again in a moment.</p>
    <button onClick={unstable_retry} className="mt-6 min-h-11 rounded-full border border-border px-5 text-sm hover:bg-muted">Try again</button>
  </div>;
}
