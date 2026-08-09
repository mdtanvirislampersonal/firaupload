"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, X, FileUp } from "lucide-react";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  url?: string;
};

function uploadOne(
  file: File,
  folder: string,
  isIndexed: boolean,
  onProgress: (p: number) => void,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);
    fd.append("isIndexed", isIndexed ? "true" : "false");

    xhr.open("POST", "/api/files/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve({ ok: true, url: json.data?.file?.url });
        } else {
          resolve({ ok: false, error: json.message || `HTTP ${xhr.status}` });
        }
      } catch {
        resolve({ ok: false, error: "Bad response" });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error" });
    xhr.send(fd);
  });
}

export function UploadDialog({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [folder, setFolder] = React.useState("");
  const [isIndexed, setIsIndexed] = React.useState(false);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const uploadingRef = React.useRef(false);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const next = arr.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      progress: 0,
      status: "pending" as const,
    }));
    setItems((prev) => [...prev, ...next]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  React.useEffect(() => {
    if (uploadingRef.current) return;
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) return;
    uploadingRef.current = true;
    (async () => {
      for (const item of pending) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "uploading" } : i,
          ),
        );
        const res = await uploadOne(item.file, folder, isIndexed, (p) => {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: p } : i)),
          );
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: res.ok ? "done" : "error",
                  progress: 100,
                  url: res.url,
                  error: res.error,
                }
              : i,
          ),
        );
      }
      uploadingRef.current = false;
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    })();
  }, [items, folder, isIndexed, qc]);

  const allDone = items.length > 0 && items.every((i) => i.status === "done" || i.status === "error");
  const succeeded = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="upload-folder">Destination folder</Label>
          <Input
            id="upload-folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="(root) or e.g. documents/2026"
          />
        </div>
        <div className="flex items-end gap-2">
          <Checkbox
            id="upload-indexed"
            checked={isIndexed}
            onCheckedChange={(v) => setIsIndexed(v === true)}
          />
          <Label htmlFor="upload-indexed" className="cursor-pointer text-sm">
            Enable indexing (add to sitemap)
          </Label>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <FileUp className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag &amp; drop files here, or
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" /> Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-2 rounded-md border p-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded p-2 hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={item.progress} className="h-1.5" />
                  <span className="w-10 text-right text-[11px] text-muted-foreground">
                    {item.status === "done"
                      ? "done"
                      : item.status === "error"
                      ? "fail"
                      : `${item.progress}%`}
                  </span>
                </div>
                {item.error && (
                  <p className="mt-0.5 text-[11px] text-destructive">{item.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {items.length === 0
            ? "No files selected"
            : `${succeeded}/${items.length} uploaded`}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Close
          </Button>
          {allDone && (
            <Button
              type="button"
              onClick={() => {
                onDone?.();
                router.refresh();
              }}
            >
              <Loader2 className="mr-2 h-4 w-4 opacity-0" />
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
