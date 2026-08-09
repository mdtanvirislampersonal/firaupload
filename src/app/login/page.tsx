// Server component page that wraps the client login form in a Suspense
// boundary. Next.js 16 requires useSearchParams() to be inside a Suspense
// boundary at the page level so the page can be statically rendered.

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-background dark:from-emerald-950/20 p-4">
      <div className="w-full max-w-md h-96 animate-pulse rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-muted/40" />
    </div>
  );
}
