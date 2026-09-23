import { can } from "@/platform/authz/policy";
import type { Actor } from "@/platform/authz/types";
import { refundRepository } from "@/tools/refund-review/data";
import type { RefundRequest } from "@/tools/refund-review/domain";

export interface QueueFilters {
  q?: string;
  status?: string;
  reason?: string;
}

/** Reads go through the policy engine, so the queue reflects authorization. */
export function listVisibleRefunds(actor: Actor, filters: QueueFilters = {}): RefundRequest[] {
  const query = filters.q?.trim().toLowerCase();

  return refundRepository
    .list()
    .filter((refund) => can(actor, "refunds.request.read", refund))
    .filter((refund) => (filters.status ? refund.status === filters.status : true))
    .filter((refund) => (filters.reason ? refund.reason === filters.reason : true))
    .filter((refund) =>
      query
        ? refund.customerAlias.toLowerCase().includes(query) ||
          refund.reference.toLowerCase().includes(query) ||
          refund.transactionRef.toLowerCase().includes(query)
        : true,
    )
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function getVisibleRefund(actor: Actor, refundId: string): RefundRequest | undefined {
  const refund = refundRepository.get(refundId);
  if (!refund || !can(actor, "refunds.request.read", refund)) return undefined;
  return refund;
}
