import "server-only";

// Reusable WordPress media uploader.
// Posts a file to /wp-json/wp/v2/media using Application Password auth.

import { getWordPressAuthHeader, getWordPressCredentials } from "./auth";

export const WORDPRESS_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export interface WordPressMediaResponse {
  id: number;
  date: string;
  slug: string;
  link: string;
  source_url: string;
  mime_type: string;
  media_type: string;
  title: { rendered: string };
}

export interface UploadFileOptions {
  filename?: string;
  contentType?: string;
  maxBytes?: number;
}

type UploadInput = Blob | File | ArrayBuffer | Uint8Array;

interface NormalizedUpload {
  body: BodyInit;
  size: number;
  filename: string;
  contentType: string;
}

function normalizeInput(file: UploadInput, options: UploadFileOptions): NormalizedUpload {
  let body: BodyInit;
  let size: number;
  let filename = options.filename;
  let contentType = options.contentType;

  if (typeof File !== "undefined" && file instanceof File) {
    body = file;
    size = file.size;
    filename = filename ?? file.name;
    contentType = contentType ?? (file.type || undefined);
  } else if (file instanceof Blob) {
    body = file;
    size = file.size;
    contentType = contentType ?? (file.type || undefined);
  } else if (file instanceof ArrayBuffer) {
    body = new Blob([file]);
    size = file.byteLength;
  } else if (file instanceof Uint8Array) {
    const copy = new Uint8Array(file.byteLength);
    copy.set(file);
    body = new Blob([copy.buffer]);
    size = file.byteLength;
  } else {
    throw new Error("uploadFileToWordPress: unsupported file input type.");
  }

  if (!filename) {
    throw new Error("uploadFileToWordPress: a filename is required.");
  }

  return {
    body,
    size,
    filename,
    contentType: contentType ?? "application/octet-stream",
  };
}

export async function uploadFileToWordPress(
  file: UploadInput,
  options: UploadFileOptions = {}
): Promise<WordPressMediaResponse> {
  const maxBytes = options.maxBytes ?? WORDPRESS_UPLOAD_MAX_BYTES;
  const { body, size, filename, contentType } = normalizeInput(file, options);

  if (size <= 0) {
    throw new Error("uploadFileToWordPress: file is empty.");
  }
  if (size > maxBytes) {
    const sizeMb = (size / (1024 * 1024)).toFixed(2);
    const limitMb = (maxBytes / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File too large: ${sizeMb} MB exceeds the ${limitMb} MB limit.`
    );
  }

  const credentials = getWordPressCredentials();
  const safeFilename = filename.replace(/"/g, "");

  const response = await fetch(`${credentials.baseUrl}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: getWordPressAuthHeader(credentials),
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `WordPress media upload failed (${response.status} ${response.statusText}): ${detail}`
    );
  }

  return (await response.json()) as WordPressMediaResponse;
}
