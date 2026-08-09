"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";
import { monacoLanguageFor, buildFileUrl } from "@/lib/files-shared";

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type ContentResponse = {
  fileId: string;
  name: string;
  extension: string;
  content: string;
  size: number;
};

export function CodeEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { resolvedTheme } = useTheme();
  const fileId = params?.id;

  const [value, setValue] = React.useState<string>("");
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const query = useQuery<ContentResponse>({
    queryKey: ["file-content", fileId],
    queryFn: async () => {
      const res = await fetch(`/api/files/content?fileId=${fileId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      return json.data as ContentResponse;
    },
    enabled: !!fileId,
  });

  React.useEffect(() => {
    if (typeof query.data?.content === "string") {
      setValue(query.data.content);
      setDirty(false);
    }
  }, [query.data?.content]);

  // Ctrl/Cmd+S to save
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function save() {
    if (!fileId || !dirty || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, content: value }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Save failed");
        return;
      }
      toast.success("Saved");
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["file-content", fileId] });
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  const language = monacoLanguageFor(query.data?.extension || "");
  const fileName = query.data?.name || "…";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{fileName}</h1>
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Unsaved changes — press Ctrl/Cmd+S to save
            </span>
          )}
        </div>
        <a
          href={fileId ? buildFileUrl(query.data?.name ? `${query.data.name.split(".").slice(0, -1).join(".")}` : "") : "#"}
          className="hidden"
          aria-hidden
        >
          link
        </a>
        {query.data && (
          <a
            href={buildFileUrl(`${query.data.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" /> View
            </Button>
          </a>
        )}
        <Button onClick={save} disabled={!dirty || saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-mono text-muted-foreground">
            {language} • {query.data?.size || 0} bytes
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-2.5rem)] p-0">
          {query.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : query.isError ? (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              Could not load file content.
            </div>
          ) : (
            <MonacoEditor
              language={language}
              value={value}
              theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
              onChange={(v) => {
                setValue(v ?? "");
                setDirty(v !== query.data?.content);
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                renderLineHighlight: "all",
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
