"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function NewFileDialog({ onDone }: { onDone?: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [folder, setFolder] = React.useState("");
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/files/create-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), folder, content }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Could not create file");
        return;
      }
      toast.success("File created");
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-file-name">File name</Label>
          <Input
            id="new-file-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="index.html"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-file-folder">Destination folder</Label>
          <Input
            id="new-file-folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="(root) or e.g. docs"
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-file-content">Initial content (optional)</Label>
        <Textarea
          id="new-file-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Type or paste content..."
          disabled={loading}
          className="font-mono text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Allowed extensions: txt, html, css, js, json, xml, php, md, yml, csv, etc.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create file
        </Button>
      </div>
    </form>
  );
}
