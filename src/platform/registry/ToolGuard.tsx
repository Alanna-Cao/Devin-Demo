import type { ReactNode } from "react";
import { getCurrentActor } from "@/platform/auth/session";
import { can } from "@/platform/authz/policy";
import { getTool } from "@/platform/registry/registry";

/**
 * Route-level guard for a tool. Wrap a tool's Next.js layout in this and every
 * route below it is protected by the tool's `requiredPermission`.
 */
export function ToolGuard({ toolId, children }: { toolId: string; children: ReactNode }) {
  const actor = getCurrentActor();
  const tool = getTool(toolId);

  if (!can(actor, tool.requiredPermission)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-base font-semibold text-red-900">Access denied</h1>
        <p className="mt-1 text-sm text-red-800">
          {actor.name} ({actor.role}) does not hold <code>{tool.requiredPermission}</code>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
