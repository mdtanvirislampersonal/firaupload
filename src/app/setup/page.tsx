import { redirect } from "next/navigation";
import { countAdmins, githubConfigured } from "@/lib/github-store";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (!githubConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">GitHub not configured</h1>
          <p className="text-muted-foreground text-sm">
            Set <code className="px-1 py-0.5 bg-muted rounded">GITHUB_OWNER</code>,{" "}
            <code className="px-1 py-0.5 bg-muted rounded">GITHUB_REPOSITORY</code>,{" "}
            <code className="px-1 py-0.5 bg-muted rounded">GITHUB_TOKEN</code> and{" "}
            <code className="px-1 py-0.5 bg-muted rounded">GITHUB_ENABLED=true</code>{" "}
            in your environment to use the file manager.
          </p>
        </div>
      </div>
    );
  }
  const adminCount = await countAdmins();
  if (adminCount > 0) {
    redirect("/login");
  }
  return <SetupForm />;
}
