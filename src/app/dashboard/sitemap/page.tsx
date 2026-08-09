import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, ExternalLink, Copy } from "lucide-react";
import { CopyButton } from "@/components/dashboard/CopyButton";

export const dynamic = "force-dynamic";

export default function SitemapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Map className="h-6 w-6 text-primary" /> Sitemap
        </h1>
        <p className="text-sm text-muted-foreground">
          Your sitemap is generated dynamically from every file with the
          “Indexing” switch turned on.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public endpoints</CardTitle>
          <CardDescription>
            These routes are public — anyone (including Googlebot) can fetch them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EndpointRow
            title="sitemap.xml"
            url="/sitemap.xml"
            description="List of indexed file URLs with lastmod timestamps."
          />
          <EndpointRow
            title="robots.txt"
            url="/robots.txt"
            description="Allows all crawlers and points to the sitemap."
          />
          <EndpointRow
            title="File preview"
            url="/uploads/{path}"
            description="Secure static serving with forced download for executable types."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
          <CardDescription>The sitemap is rebuilt on every request.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Only files with <code>isIndexed = true</code> are included.</li>
            <li>Directories are never listed.</li>
            <li>Each entry has a <code>&lt;lastmod&gt;</code> from the file's <code>updatedAt</code>.</li>
            <li>URLs use the current request host (via <code>x-forwarded-proto</code> + <code>x-forwarded-host</code>), validated against <code>TRUSTED_HOSTS</code> when set.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function EndpointRow({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <code className="text-xs text-muted-foreground break-all">{url}</code>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <CopyButton value={url} />
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </Link>
        </Button>
      </div>
    </div>
  );
}
