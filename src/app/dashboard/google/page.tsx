import { GoogleIndexPanel } from "@/components/google/GoogleIndexPanel";

export const dynamic = "force-dynamic";

export default function GooglePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Indexing</h1>
        <p className="text-sm text-muted-foreground">
          Check and request Google to index your public file URLs.
        </p>
      </div>
      <GoogleIndexPanel />
    </div>
  );
}
