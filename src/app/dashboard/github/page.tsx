import { GithubSyncPanel } from "@/components/github/GithubSyncPanel";

export const dynamic = "force-dynamic";

export default function GithubPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GitHub Sync</h1>
        <p className="text-sm text-muted-foreground">
          Push files to a GitHub repository and keep them in sync.
        </p>
      </div>
      <GithubSyncPanel />
    </div>
  );
}
