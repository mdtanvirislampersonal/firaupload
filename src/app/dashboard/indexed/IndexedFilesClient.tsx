"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";

export default function IndexedFilesClient() {
  const router = useRouter();
  const params = useSearchParams();

  React.useEffect(() => {
    if (!params.get("filter")) {
      const sp = new URLSearchParams(params.toString());
      sp.set("filter", "indexed");
      router.replace(`/dashboard/indexed?${sp.toString()}`);
    }
  }, [params, router]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Star className="h-6 w-6 text-primary" /> Indexed Files
        </h1>
        <p className="text-sm text-muted-foreground">
          Files currently enabled for the public sitemap at{" "}
          <a
            href="/sitemap.xml"
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            /sitemap.xml
          </a>
          .
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter applied: Indexed</CardTitle>
          <CardDescription>
            Toggle the index switch on any file to add or remove it from the sitemap.
          </CardDescription>
        </CardHeader>
      </Card>
      <FileBrowser />
    </div>
  );
}
