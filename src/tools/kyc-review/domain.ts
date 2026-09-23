export const CASE_STATUSES = [
  "new",
  "in_review",
  "info_requested",
  "escalated",
  "approved",
  "rejected",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const RISK_BANDS = ["low", "medium", "high"] as const;
export type RiskBand = (typeof RISK_BANDS)[number];

export interface CaseNote {
  id: string;
  authorName: string;
  body: string;
  at: string;
}

export interface KycCase {
  id: string;
  reference: string;
  /** Synthetic label; the POC holds no PII. */
  applicantAlias: string;
  entityType: "individual" | "business";
  jurisdiction: string;
  riskBand: RiskBand;
  status: CaseStatus;
  assigneeId: string | null;
  submittedAt: string;
  notes: CaseNote[];
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "New",
  in_review: "In review",
  info_requested: "Info requested",
  escalated: "Escalated",
  approved: "Approved",
  rejected: "Rejected",
};

export function isOpen(kycCase: KycCase): boolean {
  return kycCase.status !== "approved" && kycCase.status !== "rejected";
}
