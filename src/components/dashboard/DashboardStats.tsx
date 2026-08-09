"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Files,
  Star,
  StarOff,
  HardDrive,
  Globe,
  GlobeLock,
  Github,
  Folder,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, type StatsResponse } from "@/lib/types";

type CardDef = {
  key: keyof StatsResponse;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  format?: (v: number) => string;
};

const CARDS: CardDef[] = [
  { key: "totalFiles", label: "Total Files", icon: Files, hint: "Across all folders" },
  { key: "indexedFiles", label: "Indexed Files", icon: Star, hint: "Eligible for sitemap" },
  { key: "noIndexFiles", label: "No-Index Files", icon: StarOff, hint: "Hidden from search" },
  { key: "totalStorageBytes", label: "Total Storage", icon: HardDrive, hint: "Sum of file sizes", format: formatBytes },
  { key: "googleIndexed", label: "Google Indexed", icon: Globe, hint: "URL Inspection: PASS" },
  { key: "googleNotIndexed", label: "Google Not Indexed", icon: GlobeLock, hint: "Pending or unknown" },
  { key: "githubSynced", label: "GitHub Synced", icon: Github, hint: "Pushed to remote" },
  { key: "folders", label: "Folders", icon: Folder, hint: "Directory entries" },
];

export function DashboardStats() {
  const { data, isLoading, isError, refetch } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as StatsResponse;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {CARDS.map((c) => {
        const Icon = c.icon;
        const value = data ? (c.format ? c.format(data[c.key] as number) : String(data[c.key] ?? 0)) : null;
        return (
          <Card key={c.key} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : isError ? (
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => refetch()}
                >
                  failed — retry
                </button>
              ) : (
                <>
                  <div className="text-2xl font-semibold">{value}</div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{c.hint}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
