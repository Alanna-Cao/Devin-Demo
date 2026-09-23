import { inMemoryRepository } from "@/platform/data/repository";
import type { RefundReason, RefundRequest, RefundStatus } from "@/tools/refund-review/domain";

const SEED: Array<[string, string, number, RefundReason, RefundStatus, string, string]> = [
  ["Customer #2201", "txn_8f31a2", 4_250, "duplicate_charge", "pending", "2026-09-18", "Support — Tier 1"],
  ["Customer #2214", "txn_9c02bd", 129_900, "service_not_received", "pending", "2026-09-18", "Support — Tier 2"],
  ["Northwind Foods", "txn_a41e77", 812_500, "billing_error", "pending", "2026-09-17", "Account Management"],
  ["Customer #2239", "txn_b5520c", 499_900, "fraud", "pending", "2026-09-17", "Fraud Ops"],
  ["Bluefin Capital", "txn_c93d14", 500_000, "billing_error", "pending", "2026-09-17", "Account Management"],
  ["Customer #2256", "txn_d1a806", 7_540, "customer_request", "pending", "2026-09-16", "Support — Tier 1"],
  ["Halcyon Freight", "txn_e7b229", 1_250_000, "fraud", "pending", "2026-09-16", "Fraud Ops"],
  ["Customer #2271", "txn_f0c3ab", 32_000, "duplicate_charge", "approved", "2026-09-15", "Support — Tier 1"],
  ["Customer #2288", "txn_11d4e9", 64_800, "customer_request", "rejected", "2026-09-15", "Support — Tier 2"],
  ["Meridian Health", "txn_22e5f3", 2_400_000, "service_not_received", "pending", "2026-09-14", "Account Management"],
  ["Customer #2302", "txn_33f6a1", 18_990, "billing_error", "pending", "2026-09-14", "Support — Tier 1"],
  ["Cobalt Labs", "txn_44a7b8", 975_000, "duplicate_charge", "approved", "2026-09-12", "Account Management"],
];

function seedRefunds(): RefundRequest[] {
  return SEED.map(
    ([customerAlias, transactionRef, amountCents, reason, status, requestedAt, requestedBy], index) => ({
      id: `refund_${index + 1}`,
      reference: `RFN-2026-${String(index + 1).padStart(4, "0")}`,
      customerAlias,
      transactionRef,
      amountCents,
      currency: "USD" as const,
      reason,
      requestedAt: `${requestedAt}T10:30:00.000Z`,
      requestedBy,
      status,
      decision:
        status === "pending"
          ? null
          : {
              outcome: status,
              reason:
                status === "approved" ? "Verified against processor records." : "Charge confirmed as legitimate.",
              deciderId: "u_manager",
              deciderName: "Priya Raman",
              at: `${requestedAt}T16:05:00.000Z`,
            },
    }),
  );
}

/** Tool-owned data access. Swap the adapter here to move off mocked data. */
export const refundRepository = inMemoryRepository<RefundRequest>("refund-requests", seedRefunds);
