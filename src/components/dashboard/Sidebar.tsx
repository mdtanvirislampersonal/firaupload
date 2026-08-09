"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Files,
  Star,
  Globe,
  Github,
  Map,
  ScrollText,
  Settings,
  LogOut,
  FolderTree,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/files", label: "Files", icon: Files },
  { href: "/dashboard/indexed", label: "Indexed Files", icon: Star },
  { href: "/dashboard/google", label: "Google Indexing", icon: Globe },
  { href: "/dashboard/github", label: "GitHub", icon: Github },
  { href: "/dashboard/sitemap", label: "Sitemap", icon: Map },
  { href: "/dashboard/logs", label: "Activity Logs", icon: ScrollText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { data: session } = useSession();
  const username = session?.user?.username || session?.user?.name || "admin";
  return (
    <div className="mt-auto border-t p-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase">
          {username.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{username}</p>
          <p className="truncate text-xs text-muted-foreground">
            {session?.user?.role || "ADMIN"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = React.useState(false);
  // The mobile drawer is controlled by the Header via a custom event.
  React.useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("fm:open-sidebar", onOpen);
    return () => window.removeEventListener("fm:open-sidebar", onOpen);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FolderTree className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">File Manager</p>
            <p className="text-[11px] text-muted-foreground">Admin Console</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <NavList />
          <UserCard />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-left">
                <FolderTree className="h-5 w-5" />
                <span>File Manager</span>
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex flex-1 flex-col">
            <NavList onNavigate={() => setOpen(false)} />
            <UserCard />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
