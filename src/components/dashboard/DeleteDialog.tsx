"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import type { FileRecord } from "@/lib/types";

export function DeleteDialog({
  file,
  onDone,
}: {
  file: FileRecord;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Delete failed");
        return;
      }
      toast.success("Deleted");
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
      <p className="text-sm text-muted-foreground">
        This will permanently delete{" "}
        <span className="font-medium text-foreground">{file.name}</span>
        {file.isDirectory
          ? " and all of its contents (recursively)."
          : ` (${file.size} bytes).`}
        {" "}This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete permanently
        </Button>
      </div>
    </form>
  );
}
