// Server component page that wraps the client indexed-files view in a
// Suspense boundary (required by Next.js 16 for useSearchParams()).

import { Suspense } from "react";
import IndexedFilesClient from "./IndexedFilesClient";

export const dynamic = "force-dynamic";

export default function IndexedFilesPage() {
  return (
    <Suspense fallback={<IndexedFallback />}>
      <IndexedFilesClient />
    </Suspense>
  );
}

function IndexedFallback() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Indexed Files</h1>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
    </div>
  );
}
