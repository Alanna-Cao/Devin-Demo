import { inMemoryRepository } from "@/platform/data/repository";
import type { KycCase, RiskBand, CaseStatus } from "@/tools/kyc-review/domain";

const SEED: Array<[string, KycCase["entityType"], string, RiskBand, CaseStatus, string | null, string]> = [
  ["Aurora Retail Ltd", "business", "GB", "high", "escalated", "u_analyst", "2026-09-14"],
  ["Applicant #4821", "individual", "US", "medium", "in_review", "u_analyst", "2026-09-15"],
  ["Northwind Foods", "business", "DE", "low", "new", null, "2026-09-16"],
  ["Applicant #5190", "individual", "CA", "high", "new", null, "2026-09-16"],
  ["Halcyon Freight", "business", "NL", "medium", "info_requested", "u_manager", "2026-09-12"],
  ["Applicant #5233", "individual", "US", "low", "approved", "u_manager", "2026-09-10"],
  ["Bluefin Capital", "business", "SG", "high", "in_review", "u_manager", "2026-09-13"],
  ["Applicant #5301", "individual", "IE", "medium", "new", null, "2026-09-17"],
  ["Cobalt Labs", "business", "US", "low", "rejected", "u_manager", "2026-09-09"],
  ["Applicant #5344", "individual", "GB", "high", "info_requested", "u_analyst", "2026-09-17"],
  ["Meridian Health", "business", "AU", "medium", "new", null, "2026-09-18"],
  ["Applicant #5402", "individual", "FR", "low", "in_review", "u_analyst", "2026-09-18"],
];

function seedCases(): KycCase[] {
  return SEED.map(([applicantAlias, entityType, jurisdiction, riskBand, status, assigneeId, submittedAt], index) => ({
    id: `case_${index + 1}`,
    reference: `KYC-2026-${String(index + 1).padStart(4, "0")}`,
    applicantAlias,
    entityType,
    jurisdiction,
    riskBand,
    status,
    assigneeId,
    submittedAt: `${submittedAt}T09:00:00.000Z`,
    notes: [],
  }));
}

/** Tool-owned data access. Swap the adapter here to move off mocked data. */
export const kycCaseRepository = inMemoryRepository<KycCase>("kyc-cases", seedCases);
