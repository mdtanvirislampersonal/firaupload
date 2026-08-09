"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { FileRecord } from "@/lib/types";

export function IndexToggle({
  file,
  onChange,
}: {
  file: FileRecord;
  onChange?: (next: boolean) => void;
}) {
  const qc = useQueryClient();
  const [pending, setPending] = React.useState(false);
  const [value, setValue] = React.useState(file.isIndexed);

  React.useEffect(() => setValue(file.isIndexed), [file.isIndexed]);

  async function toggle(next: boolean) {
    setPending(true);
    setValue(next);
    try {
      const res = await fetch("/api/indexing/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, isIndexed: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setValue(!next);
        toast.error(data.message || "Could not update indexing");
        return;
      }
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(next ? "Indexing enabled" : "Indexing disabled");
      onChange?.(next);
    } catch {
      setValue(!next);
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={value}
        onCheckedChange={toggle}
        disabled={pending || file.isDirectory}
        aria-label={`Toggle indexing for ${file.name}`}
        id={`idx-${file.id}`}
      />
      <Label
        htmlFor={`idx-${file.id}`}
        className="text-xs text-muted-foreground cursor-pointer"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : value ? (
          "Indexed"
        ) : (
          "No-index"
        )}
      </Label>
    </div>
  );
}
