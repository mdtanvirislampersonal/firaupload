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
  Send,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import type { FileListResponse, FileRecord } from "@/lib/types";

export function GoogleIndexPanel() {
  const qc = useQueryClient();
  const [checking, setChecking] = React.useState<Set<string>>(new Set());
  const [requesting, setRequesting] = React.useState<Set<string>>(new Set());

  const query = useQuery<FileListResponse>({
    queryKey: ["files", { filter: "google-not-indexed" }],
    queryFn: async () => {
      const res = await fetch("/api/files?filter=google-not-indexed&pageSize=50&sort=updatedAt&order=desc");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as FileListResponse;
    },
  });

  const files = query.data?.files || [];

  async function check(file: FileRecord) {
    setChecking((p) => new Set(p).add(file.id));
    try {
      const res = await fetch(`/api/indexing/status?fileId=${file.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to check");
      } else {
        toast.message(`Google status: ${data.data.status}`, {
          description: data.data.message,
        });
      }
      qc.invalidateQueries({ queryKey: ["files"] });
    } catch {
      toast.error("Network error");
    } finally {
      setChecking((p) => {
        const n = new Set(p);
        n.delete(file.id);
        return n;
      });
    }
  }

  async function request(file: FileRecord) {
    setRequesting((p) => new Set(p).add(file.id));
    try {
      const res = await fetch("/api/indexing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Request failed");
      } else {
        toast.success("Indexing requested", {
          description: data.data?.message,
        });
      }
      qc.invalidateQueries({ queryKey: ["files"] });
    } catch {
      toast.error("Network error");
    } finally {
      setRequesting((p) => {
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
            <Globe className="h-5 w-5" /> Google Indexing
          </CardTitle>
          <CardDescription>
            Check whether Google has indexed your public file URLs and submit
            indexing requests. The Google Indexing API does not guarantee a
            crawl — Google ultimately decides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            When <code>GOOGLE_INDEXING_ENABLED=false</code> (the default in this
            sandbox), every check returns a <strong>DISABLED</strong> status —
            we never fake a success response. Configure Google OAuth
            credentials in <code>.env</code> to enable live checks.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files pending Google indexing</CardTitle>
          <CardDescription>
            Files whose status is not <code>INDEXED</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : files.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              All known files are indexed or pending.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last checked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell><StatusBadge status={f.googleIndexStatus} /></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {f.googleLastChecked
                          ? new Date(f.googleLastChecked).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => check(f)}
                            disabled={checking.has(f.id)}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${checking.has(f.id) ? "animate-spin" : ""}`} />
                            Check
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => request(f)}
                            disabled={requesting.has(f.id)}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Request
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "INDEXED":
      return (
        <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Indexed</Badge>
      );
    case "NOT_INDEXED":
      return (
        <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Not indexed</Badge>
      );
    case "ERROR":
      return (
        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>
      );
    case "DISABLED":
      return (
        <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Disabled</Badge>
      );
    case "CHECKING":
      return (
        <Badge variant="outline" className="gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Checking</Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1"><HelpCircle className="h-3 w-3" /> Unknown</Badge>
      );
  }
}
