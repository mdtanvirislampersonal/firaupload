// ===========================================================================
// Zod validation schemas (server + client safe)
// ===========================================================================

import { z } from "zod";

const NAME_MAX = 180;
const PATH_MAX = 2048;

export const filenameSchema = z
  .string()
  .min(1, "Name is required")
  .max(NAME_MAX, `Name too long (max ${NAME_MAX})`)
  .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, "Name contains invalid characters");

export const folderNameSchema = z
  .string()
  .min(1, "Folder name is required")
  .max(NAME_MAX, `Name too long (max ${NAME_MAX})`)
  .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, "Folder name contains invalid characters");

export const relativePathSchema = z
  .string()
  .max(PATH_MAX, "Path too long")
  .refine((v) => !v.includes(".."), "Parent segments are not allowed");

export const fileIdSchema = z.string().min(1, "fileId is required");

export const isIndexedSchema = z.boolean();

export const createFileSchema = z.object({
  name: filenameSchema,
  folder: z.string().max(PATH_MAX).optional().default(""),
  content: z.string().optional().default(""),
});

export const createFolderSchema = z.object({
  name: folderNameSchema,
  folder: z.string().max(PATH_MAX).optional().default(""),
});

export const renameSchema = z.object({
  fileId: fileIdSchema,
  newName: filenameSchema,
});

export const moveSchema = z.object({
  fileId: fileIdSchema,
  destinationFolder: z.string().max(PATH_MAX).optional().default(""),
});

export const deleteSchema = z.object({
  fileId: fileIdSchema,
});

export const downloadSchema = z.object({
  fileId: fileIdSchema,
});

export const contentSchema = z.object({
  fileId: fileIdSchema,
});

export const saveSchema = z.object({
  fileId: fileIdSchema,
  content: z.string(),
});

export const toggleIndexSchema = z.object({
  fileId: fileIdSchema,
  isIndexed: isIndexedSchema,
});

export const indexingRequestSchema = z.object({
  fileId: fileIdSchema,
});

export const indexingStatusSchema = z.object({
  fileId: fileIdSchema,
});

export const githubSyncSchema = z.object({
  fileId: fileIdSchema.optional(),
  all: z.boolean().optional(),
});

export const githubDeleteSchema = z.object({
  fileId: fileIdSchema,
});

export const listFilesSchema = z.object({
  folder: z.string().optional().default(""),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sort: z
    .enum(["name", "size", "createdAt", "updatedAt", "type", "extension", "indexStatus"])
    .default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  filter: z
    .enum([
      "all",
      "indexed",
      "no-index",
      "images",
      "documents",
      "code",
      "archives",
      "google-indexed",
      "google-not-indexed",
      "github-synced",
    ])
    .default("all"),
  view: z.enum(["list", "grid"]).optional(),
});

export const setupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(60),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type ListFilesInput = z.infer<typeof listFilesSchema>;
