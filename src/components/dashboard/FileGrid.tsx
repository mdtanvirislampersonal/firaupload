"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, File as FileIcon, Globe, Github, Inbox } from "lucide-react";
import type { FileRecord } from "@/lib/types";
import { formatBytes, buildFileUrl } from "@/lib/files-shared";
import { IndexToggle } from "@/components/dashboard/IndexToggle";
import { FileActions } from "@/components/dashboard/FileActions";

export function FileGrid({
  files,
  isLoading,
  isError,
  selectedIds,
  onToggleSelect,
  onRetry,
  emptyTitle = "No files",
  emptyDescription = "Upload a file or create one to get started.",
}: {
  files: FileRecord[];
  isLoading?: boolean;
  isError?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">Failed to load files.</p>
        {onRetry && (
          <button onClick={onRetry} className="text-sm text-primary hover:underline">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!isLoading && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => (
            <Card key={`s-${i}`}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        : files.map((file) => {
            const isSel = selectedIds.has(file.id);
            return (
              <Card
                key={file.id}
                data-state={isSel ? "selected" : undefined}
                className={`overflow-hidden transition-shadow hover:shadow-md ${
                  isSel ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={() => onToggleSelect(file.id)}
                      aria-label={`Select ${file.name}`}
                    />
                    {file.isDirectory ? (
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-2 text-left"
                        onClick={() =>
                          router.push(
                            `/dashboard/files?folder=${encodeURIComponent(file.relativePath)}`,
                          )
                        }
                      >
                        <Folder className="h-5 w-5 shrink-0 text-primary" />
                        <span className="truncate font-medium" title={file.name}>
                          {file.name}
                        </span>
                      </button>
                    ) : (
                      <a
                        href={buildFileUrl(file.relativePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center gap-2 min-w-0"
                      >
                        <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span
                          className="truncate font-medium hover:underline"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                      </a>
                    )}
                    <FileActions file={file} />
                  </div>

                  {!file.isDirectory && isImage(file.extension) && (
                    <img
                      src={buildFileUrl(file.relativePath)}
                      alt={file.name}
                      loading="lazy"
                      className="h-28 w-full rounded-md object-cover"
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{file.isDirectory ? "Folder" : formatBytes(file.size)}</span>
                    <span>•</span>
                    <span>{file.extension.toUpperCase() || "—"}</span>
                  </div>

                  {!file.isDirectory && (
                    <div className="flex flex-wrap items-center gap-2">
                      <IndexToggle file={file} />
                      {file.googleIndexStatus === "INDEXED" && (
                        <Badge variant="default" className="gap-1">
                          <Globe className="h-3 w-3" /> Indexed
                        </Badge>
                      )}
                      {file.githubSynced && (
                        <Badge variant="secondary" className="gap-1">
                          <Github className="h-3 w-3" /> Synced
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}

function isImage(ext: string): boolean {
  return ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"].includes(
    ext.toLowerCase(),
  );
}

export { Link };
