"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { FileRecord } from "@/lib/types";

export function RenameDialog({
  file,
  onDone,
}: {
  file: FileRecord;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = React.useState(file.name);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setName(file.name), [file.name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === file.name) {
      onDone?.();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, newName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Rename failed");
        return;
      }
      toast.success("Renamed");
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
        <Label htmlFor="rename-name">New name</Label>
        <Input
          id="rename-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          disabled={loading}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Rename
        </Button>
      </div>
    </form>
  );
}
