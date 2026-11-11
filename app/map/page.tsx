
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const ChicagoMap = dynamic(() => import("./ChicagoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600">
      Loading Chicago map...
    </div>
  ),
});

export default function MapPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-blue-700 hover:underline"
      >
        ← Back to home
      </Link>

      <div className="mt-8 mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
          MetroSift / Chicago
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          Chicago Geographic Explorer
        </h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          Explore Chicago's 77 official community areas and
          98 approximate neighborhood boundaries. Search,
          zoom, and select locations to inspect their geography.
        </p>
      </div>

      <ChicagoMap />

      <div className="mt-6 text-sm text-slate-500">
        <p>
          Geographic data: City of Chicago Open Data Portal.
          Community areas are official geographic units.
          Neighborhood boundaries were developed by the
          Chicago Office of Tourism and are approximate,
          not official.
        </p>
      </div>
    </main>
  );
}
