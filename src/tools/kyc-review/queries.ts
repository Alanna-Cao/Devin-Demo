import { can } from "@/platform/authz/policy";
import type { Actor } from "@/platform/authz/types";
import { kycCaseRepository } from "@/tools/kyc-review/data";
import type { KycCase } from "@/tools/kyc-review/domain";

export interface QueueFilters {
  q?: string;
  status?: string;
  risk?: string;
  mine?: string;
}

/**
 * Reads go through the policy engine too: the list a persona sees is filtered
 * server-side by `kyc.case.read`, not hidden in the UI.
 */
export function listVisibleCases(actor: Actor, filters: QueueFilters = {}): KycCase[] {
  const query = filters.q?.trim().toLowerCase();

  return kycCaseRepository
    .list()
    .filter((kycCase) => can(actor, "kyc.case.read", kycCase))
    .filter((kycCase) => (filters.status ? kycCase.status === filters.status : true))
    .filter((kycCase) => (filters.risk ? kycCase.riskBand === filters.risk : true))
    .filter((kycCase) => (filters.mine === "1" ? kycCase.assigneeId === actor.id : true))
    .filter((kycCase) =>
      query
        ? kycCase.applicantAlias.toLowerCase().includes(query) || kycCase.reference.toLowerCase().includes(query)
        : true,
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getVisibleCase(actor: Actor, caseId: string): KycCase | undefined {
  const kycCase = kycCaseRepository.get(caseId);
  if (!kycCase || !can(actor, "kyc.case.read", kycCase)) return undefined;
  return kycCase;
}
