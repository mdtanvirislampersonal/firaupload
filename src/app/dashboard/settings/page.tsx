import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const env = {
    database: process.env.DATABASE_URL?.startsWith("file:")
      ? "SQLite"
      : "MySQL/other",
    githubEnabled: process.env.GITHUB_ENABLED === "true",
    githubOwner: process.env.GITHUB_OWNER || "",
    githubRepo: process.env.GITHUB_REPOSITORY || "",
    githubBranch: process.env.GITHUB_BRANCH || "main",
    googleEnabled: process.env.GOOGLE_INDEXING_ENABLED === "true",
    maxUploadMb: process.env.MAX_UPLOAD_SIZE_MB || "100",
    trustedHosts: process.env.TRUSTED_HOSTS || "(not set — trust incoming Host)",
    nodeEnv: process.env.NODE_ENV || "development",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of the runtime environment. Edit{" "}
          <code>.env</code> and restart the server to change these values.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Environment</CardTitle>
            <CardDescription>How this instance is configured.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Runtime" value={<Badge variant="outline">Next.js 16 / Node</Badge>} />
            <Row label="Node env" value={<code>{env.nodeEnv}</code>} />
            <Row label="Database" value={<Badge>{env.database}</Badge>} />
            <Row label="Max upload" value={<code>{env.maxUploadMb} MB</code>} />
            <Row label="Trusted hosts" value={<code>{env.trustedHosts}</code>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">GitHub</CardTitle>
            <CardDescription>Sync configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Enabled" value={<Badge variant={env.githubEnabled ? "default" : "secondary"}>{env.githubEnabled ? "Yes" : "No"}</Badge>} />
            <Row label="Repository" value={<code>{env.githubOwner && env.githubRepo ? `${env.githubOwner}/${env.githubRepo}` : "—"}</code>} />
            <Row label="Branch" value={<code>{env.githubBranch}</code>} />
            <Row label="Token" value={<Badge variant="outline">configured (hidden)</Badge>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Indexing</CardTitle>
            <CardDescription>Search Console / Indexing API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Enabled" value={<Badge variant={env.googleEnabled ? "default" : "secondary"}>{env.googleEnabled ? "Yes" : "No"}</Badge>} />
            <Row label="Client ID" value={process.env.GOOGLE_CLIENT_ID ? <Badge variant="outline">set</Badge> : <Badge variant="outline">not set</Badge>} />
            <Row label="Client secret" value={process.env.GOOGLE_CLIENT_SECRET ? <Badge variant="outline">set</Badge> : <Badge variant="outline">not set</Badge>} />
            <Row label="Refresh token" value={process.env.GOOGLE_REFRESH_TOKEN ? <Badge variant="outline">set</Badge> : <Badge variant="outline">not set</Badge>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public endpoints</CardTitle>
            <CardDescription>What this instance exposes to the web.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Sitemap" value={<a className="text-primary hover:underline" href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a>} />
            <Row label="Robots" value={<a className="text-primary hover:underline" href="/robots.txt" target="_blank" rel="noreferrer">/robots.txt</a>} />
            <Row label="Files" value={<code>/uploads/&#123;path&#125;</code>} />
            <Row label="Login" value={<a className="text-primary hover:underline" href="/login">/login</a>} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Switching to MySQL for production</CardTitle>
          <CardDescription>The sandbox ships with SQLite.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>In <code>prisma/schema.prisma</code> change <code>provider = "sqlite"</code> to <code>provider = "mysql"</code>.</li>
            <li>Set <code>DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"</code> in <code>.env</code>.</li>
            <li>Run <code>bun run db:push</code> (or <code>bun run db:migrate</code>) to create tables.</li>
            <li>The schema is intentionally written without SQLite-only features, so no other changes are required.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-1 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
