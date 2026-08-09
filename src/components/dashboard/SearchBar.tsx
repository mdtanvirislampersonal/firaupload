"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({
  defaultValue,
  folder,
}: {
  defaultValue?: string;
  folder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue || "");

  React.useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  // Debounced search
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (value === (defaultValue || "")) return;
      const params = new URLSearchParams();
      if (folder) params.set("folder", folder);
      if (value.trim()) params.set("search", value.trim());
      params.set("page", "1");
      router.push(`/dashboard/files?${params.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [value]);

  function clear() {
    setValue("");
    const params = new URLSearchParams();
    if (folder) params.set("folder", folder);
    router.push(`/dashboard/files?${params.toString()}`);
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search files..."
        className="pl-9 pr-9"
        aria-label="Search files"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={clear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
