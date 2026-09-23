export const REFUND_STATUSES = ["pending", "approved", "rejected"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_REASONS = [
  "duplicate_charge",
  "fraud",
  "service_not_received",
  "customer_request",
  "billing_error",
] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];

export interface RefundDecision {
  outcome: Exclude<RefundStatus, "pending">;
  reason: string;
  deciderId: string;
  deciderName: string;
  at: string;
}

export interface RefundRequest {
  id: string;
  reference: string;
  /** Synthetic label; the POC holds no PII. */
  customerAlias: string;
  transactionRef: string;
  /** Minor units, to keep money arithmetic exact. */
  amountCents: number;
  currency: "USD";
  reason: RefundReason;
  requestedAt: string;
  requestedBy: string;
  status: RefundStatus;
  decision: RefundDecision | null;
}

export const STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const REASON_LABELS: Record<RefundReason, string> = {
  duplicate_charge: "Duplicate charge",
  fraud: "Fraud",
  service_not_received: "Service not received",
  customer_request: "Customer request",
  billing_error: "Billing error",
};

/** Refunds at or above this value may only be decided by an admin. */
export const ADMIN_APPROVAL_THRESHOLD_CENTS = 500_000;

export function requiresAdminApproval(refund: RefundRequest): boolean {
  return refund.amountCents >= ADMIN_APPROVAL_THRESHOLD_CENTS;
}

export function isPending(refund: RefundRequest): boolean {
  return refund.status === "pending";
}

export function formatAmount(refund: Pick<RefundRequest, "amountCents" | "currency">): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: refund.currency }).format(
    refund.amountCents / 100,
  );
}
