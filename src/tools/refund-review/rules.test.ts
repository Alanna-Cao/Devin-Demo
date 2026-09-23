import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAS } from "@/platform/auth/personas";
import type { Actor } from "@/platform/authz/types";

let currentActor: Actor = PERSONAS.find((p) => p.role === "manager")!;

vi.mock("@/platform/auth/session", () => ({
  PERSONA_COOKIE: "poc_persona",
  getCurrentActor: () => currentActor,
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { can } = await import("@/platform/authz/policy");
const { auditTrailFor } = await import("@/platform/audit/audit-log");
const { refundRepository } = await import("@/tools/refund-review/data");
const { decideRefund } = await import("@/tools/refund-review/actions");
const { ADMIN_APPROVAL_THRESHOLD_CENTS } = await import("@/tools/refund-review/domain");

const admin = PERSONAS.find((p) => p.role === "admin")!;
const manager = PERSONAS.find((p) => p.role === "manager")!;
const analyst = PERSONAS.find((p) => p.role === "analyst")!;

const pending = refundRepository.list().filter((refund) => refund.status === "pending");
const smallRefund = pending.find((r) => r.amountCents < ADMIN_APPROVAL_THRESHOLD_CENTS)!;
const atThreshold = pending.find((r) => r.amountCents === ADMIN_APPROVAL_THRESHOLD_CENTS)!;
const largeRefund = pending.find((r) => r.amountCents > ADMIN_APPROVAL_THRESHOLD_CENTS)!;
const alreadyDecided = refundRepository.list().find((r) => r.status === "approved")!;

describe("refund approval authority", () => {
  it("lets an analyst read the queue but never decide", () => {
    expect(can(analyst, "refunds.request.read", smallRefund)).toBe(true);
    expect(can(analyst, "refunds.request.decide", smallRefund)).toBe(false);
  });

  it("caps a manager at refunds below the threshold", () => {
    expect(can(manager, "refunds.request.decide", smallRefund)).toBe(true);
    expect(can(manager, "refunds.request.decide", atThreshold)).toBe(false);
    expect(can(manager, "refunds.request.decide", largeRefund)).toBe(false);
  });

  it("lets an admin decide at any amount", () => {
    expect(can(admin, "refunds.request.decide", atThreshold)).toBe(true);
    expect(can(admin, "refunds.request.decide", largeRefund)).toBe(true);
  });
});

describe("decideRefund", () => {
  beforeEach(() => {
    currentActor = manager;
  });

  it("refuses an analyst even when the UI is bypassed, and audits the denial", async () => {
    currentActor = analyst;

    const result = await decideRefund({ refundId: smallRefund.id, outcome: "approved", reason: "ok" });

    expect(result).toMatchObject({ code: "unauthorized" });
    expect(refundRepository.require(smallRefund.id).status).toBe("pending");
    expect(auditTrailFor("refund_request", smallRefund.id)[0]).toMatchObject({
      action: "refunds.request.decide",
      outcome: "denied",
      actorRole: "analyst",
    });
  });

  it("refuses a manager calling the action directly on a threshold-or-above refund", async () => {
    const result = await decideRefund({
      refundId: largeRefund.id,
      outcome: "approved",
      reason: "bypassing the UI",
    });

    expect(result).toMatchObject({ code: "unauthorized" });
    expect(refundRepository.require(largeRefund.id).status).toBe("pending");
    expect(auditTrailFor("refund_request", largeRefund.id)[0]).toMatchObject({ outcome: "denied" });
  });

  it("requires a reason", async () => {
    const result = await decideRefund({ refundId: smallRefund.id, outcome: "rejected", reason: "" });

    expect(result).toMatchObject({ code: "invalid_input" });
    expect(refundRepository.require(smallRefund.id).status).toBe("pending");
  });

  it("records a manager decision under the threshold with its reason and decider", async () => {
    const result = await decideRefund({
      refundId: smallRefund.id,
      outcome: "approved",
      reason: "Duplicate confirmed with processor",
    });

    expect(result.ok).toBe(true);
    expect(refundRepository.require(smallRefund.id)).toMatchObject({
      status: "approved",
      decision: { outcome: "approved", deciderId: manager.id },
    });
    expect(auditTrailFor("refund_request", smallRefund.id)[0]).toMatchObject({
      action: "refunds.request.decide",
      outcome: "success",
      actorRole: "manager",
      summary: "Decision approved: Duplicate confirmed with processor",
    });
  });

  it("refuses a repeat decision on a refund that was already decided", async () => {
    const result = await decideRefund({
      refundId: alreadyDecided.id,
      outcome: "rejected",
      reason: "second thoughts",
    });

    expect(result).toMatchObject({ code: "conflict" });
    expect(refundRepository.require(alreadyDecided.id).status).toBe("approved");
    expect(auditTrailFor("refund_request", alreadyDecided.id)[0]).toMatchObject({ outcome: "denied" });
  });

  it("refuses a stale repeat of a decision the same actor just made", async () => {
    const target = pending.find(
      (r) => r.id !== smallRefund.id && r.amountCents < ADMIN_APPROVAL_THRESHOLD_CENTS,
    )!;

    const first = await decideRefund({ refundId: target.id, outcome: "rejected", reason: "Charge is valid" });
    const second = await decideRefund({ refundId: target.id, outcome: "approved", reason: "Stale page" });

    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ code: "conflict" });
    expect(refundRepository.require(target.id).status).toBe("rejected");
  });

  it("lets an admin decide a refund above the threshold", async () => {
    currentActor = admin;

    const result = await decideRefund({
      refundId: largeRefund.id,
      outcome: "approved",
      reason: "Verified chargeback exposure",
    });

    expect(result.ok).toBe(true);
    expect(refundRepository.require(largeRefund.id)).toMatchObject({
      status: "approved",
      decision: { deciderId: admin.id },
    });
  });
});
