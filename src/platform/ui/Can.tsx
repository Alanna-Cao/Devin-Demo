import type { ReactNode } from "react";
import { can } from "@/platform/authz/policy";
import type { Actor, Permission } from "@/platform/authz/types";

/**
 * Renders children only when the actor holds the permission. Uses the same
 * `can()` the server guards use, so a hidden affordance is always backed by a
 * server-side denial rather than relying on the UI for enforcement.
 */
export function Can({
  actor,
  permission,
  resource,
  fallback = null,
  children,
}: {
  actor: Actor;
  permission: Permission;
  resource?: unknown;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return <>{can(actor, permission, resource) ? children : fallback}</>;
}
