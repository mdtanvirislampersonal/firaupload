"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = {
  label: string;
  href: string;
};

export function Breadcrumbs({
  folder,
  className,
}: {
  folder: string;
  className?: string;
}) {
  const segments = React.useMemo(() => {
    const parts = folder.split("/").filter(Boolean);
    const crumbs: Crumb[] = [
      { label: "Home", href: "/dashboard/files" },
    ];
    let acc = "/dashboard/files";
    for (const p of parts) {
      acc += "/" + encodeURIComponent(p);
      crumbs.push({ label: decodeURIComponent(p), href: acc });
    }
    return crumbs;
  }, [folder]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm text-muted-foreground",
        className,
      )}
    >
      {segments.map((c, i) => {
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={c.href}>
            {i === 0 ? (
              <Link
                href={c.href}
                className={cn(
                  "inline-flex items-center gap-1 hover:text-foreground",
                  isLast && "text-foreground font-medium",
                )}
              >
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only">{c.label}</span>
              </Link>
            ) : (
              <Link
                href={c.href}
                className={cn(
                  "hover:text-foreground",
                  isLast && "text-foreground font-medium",
                )}
              >
                {c.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
