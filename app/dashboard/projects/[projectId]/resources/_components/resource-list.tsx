"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  FolderArchive,
  Link2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResourceListItem } from "@/lib/resources/types";

import { deleteResourceAction, type ResourceFormState } from "../actions";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ResourceList({
  projectId,
  resources,
  currentUserId,
  canDeleteAny,
}: {
  projectId: string;
  resources: ResourceListItem[];
  currentUserId: string;
  canDeleteAny: boolean;
}) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-amber-400/30 to-orange-500/20 ring-1 ring-amber-500/20">
          <FolderArchive className="size-5 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">No resources yet</p>
          <p className="text-xs text-muted-foreground">
            Upload a file or share a link with the team to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {resources.map((resource) => {
        const canDelete = canDeleteAny || resource.createdBy === currentUserId;
        return (
          <ResourceRow
            key={resource.id}
            resource={resource}
            projectId={projectId}
            canDelete={canDelete}
          />
        );
      })}
    </ul>
  );
}

function ResourceRow({
  resource,
  projectId,
  canDelete,
}: {
  resource: ResourceListItem;
  projectId: string;
  canDelete: boolean;
}) {
  const isFile = resource.kind === "file";
  const Icon = isFile ? FileText : Link2;
  const meta = isFile
    ? [resource.fileName || "", formatBytes(resource.sizeBytes)].filter(Boolean)
    : [formatHostname(resource.url)];

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-accent/30">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ${
          isFile
            ? "bg-linear-to-br from-sky-400/25 to-cyan-500/15 text-sky-700 ring-sky-500/20 dark:text-sky-300"
            : "bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-violet-500/20 dark:text-violet-300"
        }`}
      >
        <Icon className="size-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold hover:text-theme-3 hover:underline"
          >
            <span className="truncate">{resource.title}</span>
            <ExternalLink className="size-3 shrink-0 opacity-60" />
          </a>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(resource.createdAt)}
          </span>
        </div>

        {resource.description ? (
          <p className="text-xs text-muted-foreground">{resource.description}</p>
        ) : null}

        {meta.length > 0 ? (
          <p className="text-[11px] text-muted-foreground/80">
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>

      {canDelete ? (
        <DeleteResourceButton
          projectId={projectId}
          resourceId={resource.id}
          title={resource.title}
        />
      ) : null}
    </li>
  );
}

function DeleteResourceButton({
  projectId,
  resourceId,
  title,
}: {
  projectId: string;
  resourceId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={`Remove ${title}`}
      >
        <Trash2 className="size-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove resource?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{title}</span> will
            be removed from this project. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <DeleteResourceForm
            projectId={projectId}
            resourceId={resourceId}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DeleteResourceForm({
  projectId,
  resourceId,
  onSuccess,
}: {
  projectId: string;
  resourceId: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<
    ResourceFormState | undefined,
    FormData
  >(deleteResourceAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="resourceId" value={resourceId} />

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          Cancel
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Removing..." : "Remove"}
        </Button>
      </DialogFooter>
    </form>
  );
}
