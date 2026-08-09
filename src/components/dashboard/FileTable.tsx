"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Folder, File as FileIcon, Globe, Github, Inbox } from "lucide-react";
import type { FileRecord } from "@/lib/types";
import { formatBytes, formatDate, buildFileUrl, fileKindLabel } from "@/lib/files-shared";
import { IndexToggle } from "@/components/dashboard/IndexToggle";
import { FileActions } from "@/components/dashboard/FileActions";

export function FileTable({
  files,
  isLoading,
  isError,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRetry,
  emptyTitle = "No files",
  emptyDescription = "Upload a file or create one to get started.",
}: {
  files: FileRecord[];
  isLoading?: boolean;
  isError?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const allSelected = files.length > 0 && files.every((f) => selectedIds.has(f.id));

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">Failed to load files.</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onToggleSelectAll(files.map((f) => f.id))}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden sm:table-cell">Size</TableHead>
            <TableHead className="hidden lg:table-cell">Modified</TableHead>
            <TableHead>Indexing</TableHead>
            <TableHead className="hidden md:table-cell">Google</TableHead>
            <TableHead className="hidden md:table-cell">GitHub</TableHead>
            <TableHead className="w-[60px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={`s-${i}`}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              </TableRow>
            ))
          ) : (
            files.map((file) => {
              const isSel = selectedIds.has(file.id);
              return (
                <TableRow
                  key={file.id}
                  data-state={isSel ? "selected" : undefined}
                  className="group"
                >
                  <TableCell>
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={() => onToggleSelect(file.id)}
                      aria-label={`Select ${file.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      {file.isDirectory ? (
                        <Folder className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      {file.isDirectory ? (
                        <button
                          type="button"
                          className="truncate text-left font-medium hover:underline"
                          onClick={() =>
                            router.push(
                              `/dashboard/files?folder=${encodeURIComponent(file.relativePath)}`,
                            )
                          }
                        >
                          {file.name}
                        </button>
                      ) : (
                        <a
                          href={buildFileUrl(file.relativePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-medium hover:underline"
                          title={file.relativePath}
                        >
                          {file.name}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {fileKindLabel(file)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {file.isDirectory ? "—" : formatBytes(file.size)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {formatDate(file.updatedAt)}
                  </TableCell>
                  <TableCell>
                    {file.isDirectory ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <IndexToggle file={file} />
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {file.isDirectory ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <GoogleBadge status={file.googleIndexStatus} />
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {file.isDirectory ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <GithubBadge synced={file.githubSynced} />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <FileActions file={file} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function GoogleBadge({ status }: { status: string }) {
  const variant: "default" | "secondary" | "destructive" | "outline" =
    status === "INDEXED"
      ? "default"
      : status === "NOT_INDEXED"
      ? "secondary"
      : status === "ERROR"
      ? "destructive"
      : "outline";
  const label =
    status === "INDEXED"
      ? "Indexed"
      : status === "NOT_INDEXED"
      ? "Not indexed"
      : status === "ERROR"
      ? "Error"
      : status === "DISABLED"
      ? "Disabled"
      : "Unknown";
  return (
    <Badge variant={variant} className="gap-1">
      <Globe className="h-3 w-3" /> {label}
    </Badge>
  );
}

function GithubBadge({ synced }: { synced: boolean }) {
  return synced ? (
    <Badge className="gap-1"><Github className="h-3 w-3" /> Synced</Badge>
  ) : (
    <Badge variant="outline" className="gap-1 opacity-60"><Github className="h-3 w-3" /> Not synced</Badge>
  );
}

// Re-export so consumers don't need to import Link separately
export { Link };
