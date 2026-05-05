export const ROLES = ["super_admin", "admin", "manager", "member"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  member: 1,
};

export function hasAtLeast(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
