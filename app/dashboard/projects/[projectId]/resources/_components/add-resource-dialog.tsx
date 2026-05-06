"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  AlertCircle,
  FileUp,
  Link2,
  Plus,
  UploadCloud,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  addLinkResourceAction,
  uploadFileResourceAction,
  type ResourceFormState,
} from "../actions";

const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function AddResourceDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105">
            <Plus />
            Add resource
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a resource</DialogTitle>
          <DialogDescription>
            Upload a file (max 10 MB) or share a link to an external document.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <Tabs defaultValue="file" className="gap-4">
            <TabsList className="self-start">
              <TabsTrigger value="file">
                <FileUp className="size-3.5" />
                Upload file
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 className="size-3.5" />
                Add link
              </TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <FileUploadForm
                projectId={projectId}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>
            <TabsContent value="link">
              <LinkForm
                projectId={projectId}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FileUploadForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [state, action, pending] = useActionState<
    ResourceFormState | undefined,
    FormData
  >(uploadFileResourceAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (next && next.size > MAX_BYTES) {
      setClientError("File too large. Maximum size is 10 MB.");
      setFile(null);
      e.target.value = "";
      return;
    }
    setClientError(null);
    setFile(next);
    if (next && !title.trim()) {
      setTitle(next.name);
    }
  };

  const error = clientError ?? state?.error;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file-upload-input">File</Label>
        <label
          htmlFor="file-upload-input"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-theme-1/40 hover:bg-muted/60 ${
            pending ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <UploadCloud className="size-6 text-muted-foreground" />
          {file ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium">
                Click to choose a file
              </span>
              <span className="text-xs text-muted-foreground">
                Up to 10 MB
              </span>
            </div>
          )}
        </label>
        <input
          ref={fileInputRef}
          id="file-upload-input"
          type="file"
          name="file"
          className="sr-only"
          onChange={handleFileChange}
          disabled={pending}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file-title">Title</Label>
        <Input
          id="file-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Defaults to file name"
          disabled={pending}
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file-description">Description</Label>
        <Textarea
          id="file-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — what is this for?"
          disabled={pending}
          maxLength={2000}
          rows={3}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={pending || !file}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Uploading..." : "Upload file"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function LinkForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const [state, action, pending] = useActionState<
    ResourceFormState | undefined,
    FormData
  >(addLinkResourceAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="link-title">Title</Label>
        <Input
          id="link-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 brief — Google Doc"
          disabled={pending}
          maxLength={200}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="link-url">URL</Label>
        <Input
          id="link-url"
          name="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/..."
          disabled={pending}
          maxLength={2000}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="link-description">Description</Label>
        <Textarea
          id="link-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — what is this resource about?"
          disabled={pending}
          maxLength={2000}
          rows={3}
        />
      </div>

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
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Add link"}
        </Button>
      </DialogFooter>
    </form>
  );
}
