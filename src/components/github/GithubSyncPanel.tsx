"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Github,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  Trash2,
  Loader2,
} from "lucide-react";
import type { GithubStatus, FileListResponse, FileRecord } from "@/lib/types";

export function GithubSyncPanel() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = React.useState(false);

  const statusQuery = useQuery<GithubStatus>({
    queryKey: ["github-status"],
    queryFn: async () => {
      const res = await fetch("/api/github/status");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as GithubStatus;
    },
  });

  const filesQuery = useQuery<FileListResponse>({
    queryKey: ["files", { filter: "github-synced" }],
    queryFn: async () => {
      const res = await fetch("/api/files?filter=github-synced&pageSize=100&sort=updatedAt&order=desc");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as FileListResponse;
    },
  });

  const status = statusQuery.data;
  const files = filesQuery.data?.files || [];

  async function syncOne(file: FileRecord) {
    setSyncing((p) => new Set(p).add(file.id));
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Sync failed");
      } else {
        toast.success("Synced to GitHub", {
          description: data.data?.sha ? `sha: ${data.data.sha.slice(0, 7)}` : undefined,
        });
      }
      qc.invalidateQueries({ queryKey: ["files"] });
    } catch {
      toast.error("Network error");
    } finally {
      setSyncing((p) => {
        const n = new Set(p);
        n.delete(file.id);
        return n;
      });
    }
  }

  async function syncAll() {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Sync failed");
      } else {
        const d = data.data;
        toast.success(
          `Synced ${d.success}/${d.total}${d.conflicts ? ` • ${d.conflicts} conflicts` : ""}`,
        );
      }
      qc.invalidateQueries({ queryKey: ["files"] });
    } catch {
      toast.error("Network error");
    } finally {
      setSyncingAll(false);
    }
  }

  async function deleteOne(file: FileRecord) {
    if (!confirm(`Remove ${file.name} from GitHub? Local file will be kept.`)) return;
    setDeleting((p) => new Set(p).add(file.id));
    try {
      const res = await fetch("/api/github/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Delete failed");
      } else {
        toast.success("Removed from GitHub");
      }
      qc.invalidateQueries({ queryKey: ["files"] });
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting((p) => {
        const n = new Set(p);
        n.delete(file.id);
        return n;
      });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" /> GitHub Sync
          </CardTitle>
          <CardDescription>
            Push files to a GitHub repository using the Contents API. Binary
            files are base64-encoded; text files are sent as UTF-8. Conflicts
            are detected via SHA comparison and never silently overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusQuery.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : status ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Status" value={status.enabled ? "Enabled" : "Disabled"} />
              <Stat label="Reachable" value={status.reachable ? "Yes" : status.error ? "No" : "—"} />
              <Stat label="Repository" value={status.owner && status.repo ? `${status.owner}/${status.repo}` : "—"} />
              <Stat label="Branch" value={status.branch || "—"} />
            </div>
          ) : null}

          {status?.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              {status.error}
            </p>
          )}

          {!status?.enabled && (
            <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Set <code>GITHUB_ENABLED=true</code> and provide a valid{" "}
              <code>GITHUB_TOKEN</code> in <code>.env</code> to enable syncing.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={syncAll}
              disabled={!status?.enabled || syncingAll}
              className="gap-2"
            >
              {syncingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Sync all files
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                statusQuery.refetch();
                filesQuery.refetch();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files synced to GitHub</CardTitle>
          <CardDescription>
            Files with a stored remote SHA. Use the actions to re-sync or
            remove from the repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filesQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : files.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
              No files have been synced yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden md:table-cell">SHA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-xs text-muted-foreground">
                          {f.githubSha ? f.githubSha.slice(0, 10) : "—"}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => syncOne(f)}
                            disabled={syncing.has(f.id)}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncing.has(f.id) ? "animate-spin" : ""}`} />
                            Re-sync
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => deleteOne(f)}
                            disabled={deleting.has(f.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

export { Badge };
