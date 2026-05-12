export const CLIENT_STATUSES = ["active", "lead", "on_hold", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export function isClientStatus(value: unknown): value is ClientStatus {
  return (
    typeof value === "string" &&
    (CLIENT_STATUSES as readonly string[]).includes(value)
  );
}

export type ClientAssignee = {
  id: string;
  name: string;
  email: string;
};

export type ClientListItem = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  phoneCountry: string;
  website: string;
  industry: string;
  status: ClientStatus;
  address: string;
  city: string;
  country: string;
  notes: string;
  assignedMemberIds: string[];
  assignedMembers: ClientAssignee[];
  createdAt: string;
  updatedAt: string;
};
