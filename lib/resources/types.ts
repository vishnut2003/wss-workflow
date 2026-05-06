export const RESOURCE_KINDS = ["file", "link"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export function isResourceKind(value: unknown): value is ResourceKind {
  return (
    typeof value === "string" &&
    (RESOURCE_KINDS as readonly string[]).includes(value)
  );
}

export interface ResourceListItem {
  id: string;
  projectId: string;
  kind: ResourceKind;
  title: string;
  description: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  wordpressMediaId: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
