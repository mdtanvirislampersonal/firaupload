import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Files,
  Upload,
  Star,
  Globe,
  Github,
  Map,
  ScrollText,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/dashboard/files", label: "Browse files", icon: Files, desc: "Upload, rename, move, delete" },
  { href: "/dashboard/indexed", label: "Indexed files", icon: Star, desc: "Files in your sitemap" },
  { href: "/dashboard/google", label: "Google indexing", icon: Globe, desc: "Check & request indexing" },
  { href: "/dashboard/github", label: "GitHub sync", icon: Github, desc: "Push files to a repository" },
  { href: "/dashboard/sitemap", label: "Sitemap", icon: Map, desc: "View sitemap.xml & robots.txt" },
  { href: "/dashboard/logs", label: "Activity logs", icon: ScrollText, desc: "Audit trail" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your file storage, indexing, and sync status.
          </p>
        </div>
        <Link href="/dashboard/files">
          <Button className="gap-2">
            <Upload className="h-4 w-4" /> Upload files
          </Button>
        </Link>
      </div>

      <DashboardStats />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group rounded-lg border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{q.label}</p>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips</CardTitle>
          <CardDescription>
            A few things to know about this file manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Files served via <code>/uploads/*</code> are forced to download when their type is executable (php, html, js, …) — this is a static data store, not a code runner.</li>
            <li>Toggle the “Indexing” switch on any file to add it to your sitemap.</li>
            <li>The code editor supports Ctrl/Cmd+S to save (creates a version snapshot).</li>
            <li>GitHub sync detects conflicts via SHA and never silently overwrites remote changes.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
