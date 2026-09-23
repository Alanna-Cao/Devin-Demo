import type { ToolDefinition } from "@/platform/registry/types";
import type { Actor } from "@/platform/authz/types";
import { requiresAdminApproval, type RefundRequest } from "@/tools/refund-review/domain";

/**
 * Approval authority is bounded by value: a compliance manager decides refunds
 * below the threshold, anything at or above it is admin-only. Expressed as a
 * resource scope so the queue, the detail page, the `<Can>` affordances and
 * `defineAction()` all apply the identical rule server-side.
 */
export function canDecideRefund(actor: Actor, resource: unknown): boolean {
  if (actor.role === "admin") return true;
  return !requiresAdminApproval(resource as RefundRequest);
}

export const refundReviewTool: ToolDefinition = {
  id: "refund-review",
  title: "Refund Review",
  description: "Review and decision workflow for customer refund requests.",
  href: "/tools/refund-review",
  glyph: "◑",
  requiredPermission: "refunds.queue.view",
  policy: {
    grants: {
      "refunds.queue.view": ["admin", "manager", "analyst"],
      "refunds.request.read": ["admin", "manager", "analyst"],
      "refunds.request.decide": ["admin", "manager"],
    },
    scopes: {
      "refunds.request.decide": canDecideRefund,
    },
  },
};
