import { Suspense } from "react";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function FilesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground">
          Upload, organize, edit, and manage every file in your storage.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <FileBrowser />
      </Suspense>
    </div>
  );
}
