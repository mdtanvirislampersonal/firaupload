"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Folder } from "lucide-react";
import type { FileRecord, FileListResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MoveDialog({
  file,
  onDone,
}: {
  file: FileRecord;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState("");
  const [custom, setCustom] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Fetch only top-level folders for the picker
  const { data, isLoading } = useQuery<FileListResponse>({
    queryKey: ["folders-for-move"],
    queryFn: async () => {
      const res = await fetch("/api/files?filter=all&pageSize=200&sort=name&order=asc");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as FileListResponse;
    },
  });

  const folders = (data?.files || []).filter((f) => f.isDirectory);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const dest = custom.trim() || selected;
    setLoading(true);
    try {
      const res = await fetch("/api/files/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, destinationFolder: dest }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Move failed");
        return;
      }
      toast.success("Moved");
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onDone?.();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>Destination folder</Label>
        <ScrollArea className="h-48 rounded-md border p-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : folders.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No folders yet — type a path below to create one on the fly.
            </p>
          ) : (
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelected("");
                    setCustom("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                    selected === "" && !custom ? "bg-primary/10 text-primary" : "",
                  )}
                >
                  <Folder className="h-4 w-4" /> / (root)
                </button>
              </li>
              {folders.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(f.relativePath);
                      setCustom("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                      selected === f.relativePath ? "bg-primary/10 text-primary" : "",
                    )}
                  >
                    <Folder className="h-4 w-4" /> {f.relativePath}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-path">Or enter a custom path</Label>
        <Input
          id="custom-path"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. documents/2026"
          disabled={loading}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Move
        </Button>
      </div>
    </form>
  );
}
