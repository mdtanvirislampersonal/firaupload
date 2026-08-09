"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Upload, FilePlus, FolderPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadDialog } from "@/components/dashboard/UploadDialog";
import { NewFileDialog } from "@/components/dashboard/NewFileDialog";
import { NewFolderDialog } from "@/components/dashboard/NewFolderDialog";

function openSidebar() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("fm:open-sidebar"));
  }
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = React.useState("");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [newFileOpen, setNewFileOpen] = React.useState(false);
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/dashboard/files?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="pl-9"
            aria-label="Search files"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        {pathname?.startsWith("/dashboard/files") ? (
          <div className="hidden sm:flex items-center gap-1">
            <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden md:inline">New folder</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New folder</DialogTitle>
                </DialogHeader>
                <NewFolderDialog
                  onDone={() => setNewFolderOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <FilePlus className="h-4 w-4" />
                  <span className="hidden md:inline">New file</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New text file</DialogTitle>
                </DialogHeader>
                <NewFileDialog onDone={() => setNewFileOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload files</DialogTitle>
                </DialogHeader>
                <UploadDialog onDone={() => setUploadOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Link href="/dashboard/files">
            <Button variant="ghost" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">Manage files</span>
            </Button>
          </Link>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
