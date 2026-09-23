import { getRegisteredTools } from "@/platform/registry/registry";
import { platformPolicy } from "@/platform/authz/platform-policy";
import type { Actor, Permission, PolicyModule, ScopeRule } from "@/platform/authz/types";

/**
 * The effective policy is the platform policy plus every registered tool's
 * policy module. Adding a tool therefore extends the permission table without
 * editing anything here.
 */
function collectPolicies(): PolicyModule[] {
  return [platformPolicy, ...getRegisteredTools().map((tool) => tool.policy)];
}

function grantedRoles(permission: Permission): readonly string[] | undefined {
  for (const policy of collectPolicies()) {
    const roles = policy.grants[permission];
    if (roles) return roles;
  }
  return undefined;
}

function scopeRule(permission: Permission): ScopeRule | undefined {
  for (const policy of collectPolicies()) {
    const rule = policy.scopes?.[permission];
    if (rule) return rule;
  }
  return undefined;
}

/**
 * Single authorization entry point, used by server guards, `defineAction()`
 * and the `<Can>` UI component so enforcement and affordances cannot drift.
 */
export function can(actor: Actor, permission: Permission, resource?: unknown): boolean {
  const roles = grantedRoles(permission);
  if (!roles || !roles.includes(actor.role)) return false;
  if (resource === undefined) return true;
  const rule = scopeRule(permission);
  return rule ? rule(actor, resource) : true;
}

export class AuthorizationError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Not authorized: ${permission}`);
    this.name = "AuthorizationError";
  }
}

/** Server-side guard for pages and layouts. */
export function requirePermission(actor: Actor, permission: Permission, resource?: unknown): void {
  if (!can(actor, permission, resource)) throw new AuthorizationError(permission);
}

/** Every permission the actor holds; used for debugging and the persona panel. */
export function permissionsFor(actor: Actor): Permission[] {
  const result = new Set<Permission>();
  for (const policy of collectPolicies()) {
    for (const [permission, roles] of Object.entries(policy.grants)) {
      if (roles.includes(actor.role)) result.add(permission);
    }
  }
  return Array.from(result).sort();
}
