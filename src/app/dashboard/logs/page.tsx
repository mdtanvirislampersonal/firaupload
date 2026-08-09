"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import type { LogRecord } from "@/lib/types";

const ACTIONS = [
  "all",
  "LOGIN",
  "LOGOUT",
  "UPLOAD",
  "UPLOAD_MULTIPLE",
  "CREATE_FILE",
  "CREATE_FOLDER",
  "EDIT",
  "RENAME",
  "MOVE",
  "DELETE",
  "INDEX_ENABLED",
  "INDEX_DISABLED",
  "GOOGLE_STATUS_CHECK",
  "GOOGLE_INDEX_REQUEST",
  "GITHUB_SYNC",
  "GITHUB_DELETE",
];

type LogsResponse = {
  logs: LogRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function LogsPage() {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const query = useQuery<LogsResponse>({
    queryKey: ["logs", { page, action, search }],
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", "25");
      if (action !== "all") sp.set("action", action);
      if (search.trim()) sp.set("search", search.trim());
      const res = await fetch(`/api/logs?${sp.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as LogsResponse;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ScrollText className="h-6 w-6 text-primary" /> Activity Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Every meaningful action is recorded for auditing. Passwords and
          tokens are never logged.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a === "all" ? "All actions" : a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search target / details / user"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full sm:w-64"
          />
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1"
            onClick={() => query.refetch()}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>
            {query.data
              ? `${query.data.pagination.total} total • page ${query.data.pagination.page} of ${query.data.pagination.totalPages}`
              : "Loading…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="hidden md:table-cell">User</TableHead>
                  <TableHead className="hidden md:table-cell">IP</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="hidden xl:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : query.data && query.data.logs.length > 0 ? (
                  query.data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                          {log.action}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.target || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {log.user?.username || "system"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">
                        {log.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                        {log.details || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                      No activity yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {query.data && query.data.pagination.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={query.data.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {query.data.pagination.page} / {query.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={query.data.pagination.page >= query.data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
