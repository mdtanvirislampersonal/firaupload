"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "indexed", label: "Indexed" },
  { value: "no-index", label: "No-Index" },
  { value: "images", label: "Images" },
  { value: "documents", label: "Documents" },
  { value: "code", label: "Code" },
  { value: "archives", label: "Archives" },
  { value: "google-indexed", label: "Google Indexed" },
  { value: "google-not-indexed", label: "Google Not Indexed" },
  { value: "github-synced", label: "GitHub Synced" },
];

const SORTS: Array<{ value: string; label: string }> = [
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Modified" },
  { value: "type", label: "Type" },
  { value: "extension", label: "Extension" },
  { value: "indexStatus", label: "Index status" },
];

export function FilterBar({
  folder,
  search,
  filter,
  sort,
  order,
  view,
}: {
  folder?: string;
  search?: string;
  filter?: string;
  sort?: string;
  order?: string;
  view?: string;
}) {
  const router = useRouter();

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (folder) params.set("folder", folder);
    if (search) params.set("search", search);
    if (filter) params.set("filter", filter);
    if (sort) params.set("sort", sort);
    if (order) params.set("order", order);
    if (view) params.set("view", view);
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    params.set("page", "1");
    router.push(`/dashboard/files?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filter || "all"}
        onValueChange={(v) => pushParams({ filter: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="h-9 w-[160px]" aria-label="Filter">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          {FILTERS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sort || "name"}
        onValueChange={(v) => pushParams({ sort: v })}
      >
        <SelectTrigger className="h-9 w-[140px]" aria-label="Sort field">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={order || "asc"}
        onValueChange={(v) => pushParams({ order: v })}
      >
        <SelectTrigger className="h-9 w-[110px]" aria-label="Sort direction">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        value={view || "list"}
        onValueChange={(v) => {
          if (v) pushParams({ view: v });
        }}
        className="ml-auto"
        aria-label="View mode"
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
