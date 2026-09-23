/**
 * Authorization primitives shared by every tool on the platform.
 *
 * Model: roles are bundles of permissions. A permission is a dotted string
 * owned by the tool that defines it, e.g. `kyc.case.approve`. Access is
 * deny-by-default: a permission that no policy module grants is denied.
 *
 * Tools never hard-code role checks. They declare a `PolicyModule` in their
 * `tool.config.ts` and call `can()` / `defineAction()`.
 */

export const ROLES = ["admin", "manager", "analyst"] as const;

export type Role = (typeof ROLES)[number];

export type Permission = string;

/**
 * A resource-level rule. Runs only after the role grant has already passed,
 * and narrows access to individual records (e.g. "an analyst may only open
 * cases assigned to them").
 */
export type ScopeRule = (actor: Actor, resource: unknown) => boolean;

export interface PolicyModule {
  /** permission -> roles that hold it */
  grants: Record<Permission, readonly Role[]>;
  /** permission -> extra per-resource check, applied when a resource is passed to `can()` */
  scopes?: Record<Permission, ScopeRule>;
}

export interface Actor {
  id: string;
  name: string;
  title: string;
  role: Role;
}
