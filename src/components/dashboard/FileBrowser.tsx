"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FilePlus,
  FolderPlus,
  Trash2,
  Star,
  StarOff,
  Github,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { FileListResponse, FileRecord } from "@/lib/types";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { FileTable } from "@/components/dashboard/FileTable";
import { FileGrid } from "@/components/dashboard/FileGrid";
import { UploadDialog } from "@/components/dashboard/UploadDialog";
import { NewFileDialog } from "@/components/dashboard/NewFileDialog";
import { NewFolderDialog } from "@/components/dashboard/NewFolderDialog";

export function FileBrowser() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();

  const folder = params.get("folder") || "";
  const search = params.get("search") || "";
  const filter = params.get("filter") || "all";
  const sort = params.get("sort") || "name";
  const order = params.get("order") || "asc";
  const view = params.get("view") || "list";
  const page = Number(params.get("page") || "1");

  const query = useQuery<FileListResponse>({
    queryKey: ["files", { folder, search, filter, sort, order, page }],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (folder) sp.set("folder", folder);
      if (search) sp.set("search", search);
      if (filter) sp.set("filter", filter);
      if (sort) sp.set("sort", sort);
      if (order) sp.set("order", order);
      sp.set("page", String(page));
      sp.set("pageSize", "25");
      const res = await fetch(`/api/files?${sp.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as FileListResponse;
    },
  });

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [newFileOpen, setNewFileOpen] = React.useState(false);
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);

  // Reset selection when folder/page changes
  React.useEffect(() => {
    setSelected(new Set());
  }, [folder, page, filter, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }

  function goToPage(p: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`/dashboard/files?${sp.toString()}`);
  }

  async function bulkIndex(next: boolean) {
    if (selected.size === 0) return;
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try {
        const res = await fetch("/api/indexing/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: id, isIndexed: next }),
        });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    toast.success(`${ok} updated${fail ? `, ${fail} failed` : ""}`);
    qc.invalidateQueries({ queryKey: ["files"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    setSelected(new Set());
  }

  async function bulkSyncGithub() {
    if (selected.size === 0) return;
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try {
        const res = await fetch("/api/github/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: id }),
        });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    toast.success(`${ok} synced${fail ? `, ${fail} failed` : ""}`);
    qc.invalidateQueries({ queryKey: ["files"] });
    setSelected(new Set());
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected item(s)? This cannot be undone.`)) return;
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try {
        const res = await fetch("/api/files/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: id }),
        });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    toast.success(`${ok} deleted${fail ? `, ${fail} failed` : ""}`);
    qc.invalidateQueries({ queryKey: ["files"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    setSelected(new Set());
  }

  const files = query.data?.files || [];
  const pagination = query.data?.pagination;
  const selectedFiles = files.filter((f) => selected.has(f.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Breadcrumbs folder={folder} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setNewFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New folder</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setNewFileOpen(true)}
          >
            <FilePlus className="h-4 w-4" />
            <span className="hidden sm:inline">New file</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar defaultValue={search} folder={folder} />
        <FilterBar
          folder={folder}
          search={search}
          filter={filter}
          sort={sort}
          order={order}
          view={view}
        />
      </div>

      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-2 p-3">
            <span className="text-sm font-medium">
              {selected.size} selected
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => bulkIndex(true)}>
                <Star className="h-3.5 w-3.5" /> Enable index
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => bulkIndex(false)}>
                <StarOff className="h-3.5 w-3.5" /> Disable index
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={bulkSyncGithub}>
                <Github className="h-3.5 w-3.5" /> Sync GitHub
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={bulkDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {folder ? `Contents of ${folder}` : "All files"}
          </CardTitle>
          <CardDescription>
            {pagination
              ? `${pagination.total} item${pagination.total === 1 ? "" : "s"} • page ${pagination.page} of ${pagination.totalPages}`
              : "Loading…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "grid" ? (
            <FileGrid
              files={files}
              isLoading={query.isLoading}
              isError={query.isError}
              selectedIds={selected}
              onToggleSelect={toggleSelect}
              onRetry={() => query.refetch()}
            />
          ) : (
            <FileTable
              files={files}
              isLoading={query.isLoading}
              isError={query.isError}
              selectedIds={selected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onRetry={() => query.refetch()}
            />
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
          </DialogHeader>
          <UploadDialog onDone={() => setUploadOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New text file</DialogTitle>
          </DialogHeader>
          <NewFileDialog onDone={() => setNewFileOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <NewFolderDialog onDone={() => setNewFolderOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Hint about downloads of selected files (one-by-one via XHR fallback) */}
      {selectedFiles.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Need to download all selected?</summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedFiles.map((f) => (
              <a
                key={f.id}
                href={`/api/files/download?fileId=${f.id}`}
                className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-accent"
                download
              >
                <Download className="h-3 w-3" /> {f.name}
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
