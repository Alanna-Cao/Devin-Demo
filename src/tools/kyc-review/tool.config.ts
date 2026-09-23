import type { ToolDefinition } from "@/platform/registry/types";
import type { Actor } from "@/platform/authz/types";
import type { KycCase } from "@/tools/kyc-review/domain";

/**
 * An analyst works a personal queue: their own cases plus anything unclaimed.
 * Managers and admins see the whole book of work. This is the tool's only
 * resource-level rule and the policy engine applies it everywhere.
 */
export function canSeeCase(actor: Actor, resource: unknown): boolean {
  const kycCase = resource as KycCase;
  if (actor.role === "admin" || actor.role === "manager") return true;
  return kycCase.assigneeId === actor.id || kycCase.assigneeId === null;
}

export const kycReviewTool: ToolDefinition = {
  id: "kyc-review",
  title: "KYC Review Queue",
  description: "Triage and decision workflow for customer due-diligence cases.",
  href: "/tools/kyc-review",
  glyph: "◧",
  requiredPermission: "kyc.queue.view",
  policy: {
    grants: {
      "kyc.queue.view": ["admin", "manager", "analyst"],
      "kyc.case.read": ["admin", "manager", "analyst"],
      "kyc.case.claim": ["admin", "manager", "analyst"],
      "kyc.case.note": ["admin", "manager", "analyst"],
      "kyc.case.escalate": ["admin", "manager", "analyst"],
      "kyc.case.decide": ["admin", "manager"],
      "kyc.case.assign": ["admin", "manager"],
    },
    scopes: {
      "kyc.case.read": canSeeCase,
      "kyc.case.claim": canSeeCase,
      "kyc.case.note": canSeeCase,
      "kyc.case.escalate": canSeeCase,
    },
  },
};
