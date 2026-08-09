"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  FolderOpen,
  Eye,
  Pencil,
  Download,
  PencilLine,
  FolderInput,
  Star,
  StarOff,
  Globe,
  Github,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { FileRecord } from "@/lib/types";
import { buildFileUrl, isEditableFile } from "@/lib/files-shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RenameDialog } from "@/components/dashboard/RenameDialog";
import { MoveDialog } from "@/components/dashboard/MoveDialog";
import { DeleteDialog } from "@/components/dashboard/DeleteDialog";

// Re-export a small helper for client components
export { isEditableFile };

function FileActionsImpl({ file }: { file: FileRecord }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const editable = !file.isDirectory && isEditableFile(file.extension);
  const publicUrl = buildFileUrl(file.relativePath);

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["files"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  }

  async function toggleIndex(next: boolean) {
    try {
      const res = await fetch("/api/indexing/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, isIndexed: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed");
        return;
      }
      toast.success(next ? "Indexing enabled" : "Indexing disabled");
      invalidateAll();
    } catch {
      toast.error("Network error");
    }
  }

  async function syncGithub() {
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "GitHub sync failed");
        return;
      }
      toast.success("Synced to GitHub");
      invalidateAll();
    } catch {
      toast.error("Network error");
    }
  }

  async function checkGoogle() {
    try {
      const res = await fetch(`/api/indexing/status?fileId=${file.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Google check failed");
        return;
      }
      toast.message(`Google status: ${data.data.status}`, {
        description: data.data.message || undefined,
      });
      invalidateAll();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="File actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {file.isDirectory ? (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/files?folder=${encodeURIComponent(file.relativePath)}`)}>
              <FolderOpen className="mr-2 h-4 w-4" /> Open
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </a>
              </DropdownMenuItem>
              {editable && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/editor/${file.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <a href={`/api/files/download?fileId=${file.id}`} download>
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleIndex(!file.isIndexed)}>
                {file.isIndexed ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" /> Disable indexing
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" /> Enable indexing
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={checkGoogle}>
                <Globe className="mr-2 h-4 w-4" /> Check Google status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={syncGithub}>
                <Github className="mr-2 h-4 w-4" /> Sync to GitHub
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <PencilLine className="mr-2 h-4 w-4" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMoveOpen(true)}>
            <FolderInput className="mr-2 h-4 w-4" /> Move
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <RenameDialog file={file} onDone={() => setRenameOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {file.name}</DialogTitle>
          </DialogHeader>
          <MoveDialog file={file} onDone={() => setMoveOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {file.name}?</DialogTitle>
          </DialogHeader>
          <DeleteDialog file={file} onDone={() => setDeleteOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FileActions(props: { file: FileRecord }) {
  return <FileActionsImpl {...props} />;
}
