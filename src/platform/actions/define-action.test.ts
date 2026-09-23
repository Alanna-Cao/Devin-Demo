import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAS } from "@/platform/auth/personas";
import type { Actor } from "@/platform/authz/types";

let currentActor: Actor = PERSONAS.find((p) => p.role === "analyst")!;

vi.mock("@/platform/auth/session", () => ({
  PERSONA_COOKIE: "poc_persona",
  getCurrentActor: () => currentActor,
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { auditTrailFor } = await import("@/platform/audit/audit-log");
const { kycCaseRepository } = await import("@/tools/kyc-review/data");
const { addNote, decideCase, escalateCase } = await import("@/tools/kyc-review/actions");

const analyst = PERSONAS.find((p) => p.role === "analyst")!;
const manager = PERSONAS.find((p) => p.role === "manager")!;

const analystCase = kycCaseRepository.list().find((c) => c.assigneeId === analyst.id && c.status === "in_review")!;
const managerCase = kycCaseRepository.list().find((c) => c.assigneeId === manager.id && c.status === "in_review")!;

describe("defineAction misuse guard", () => {
  it("fails loudly if its callbacks were turned into server actions", async () => {
    const { defineAction } = await import("@/platform/actions/define-action");
    const { z } = await import("zod");

    const action = defineAction({
      name: "kyc.case.note",
      permission: "kyc.case.note",
      input: z.object({ caseId: z.string() }),
      // What Next.js produces when actions are defined in a "use server" module.
      subject: (async () => ({ type: "kyc_case", id: "case_1" })) as never,
      handler: () => undefined,
      summary: () => "",
    });

    await expect(action({ caseId: "case_1" })).rejects.toThrow(/returned a promise/);
  });
});

describe("defineAction", () => {
  beforeEach(() => {
    currentActor = analyst;
  });

  it("rejects an action the actor's role does not grant, and audits the denial", async () => {
    const result = await decideCase({ caseId: analystCase.id, outcome: "approved", reason: "looks fine" });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "unauthorized" });
    expect(kycCaseRepository.require(analystCase.id).status).toBe("in_review");
    expect(auditTrailFor("kyc_case", analystCase.id)[0]).toMatchObject({
      action: "kyc.case.decide",
      outcome: "denied",
      actorId: analyst.id,
    });
  });

  it("enforces resource-level scope, not just the role grant", async () => {
    const result = await addNote({ caseId: managerCase.id, body: "not my case" });

    expect(result).toMatchObject({ code: "unauthorized" });
    expect(kycCaseRepository.require(managerCase.id).notes).toHaveLength(0);
  });

  it("validates input before doing anything", async () => {
    const result = await addNote({ caseId: analystCase.id, body: "" });

    expect(result).toMatchObject({ code: "invalid_input" });
    expect(auditTrailFor("kyc_case", analystCase.id).some((e) => e.action === "kyc.case.note")).toBe(false);
  });

  it("executes an authorized action and audits it automatically", async () => {
    currentActor = manager;

    const result = await decideCase({ caseId: managerCase.id, outcome: "approved", reason: "EDD complete" });

    expect(result.ok).toBe(true);
    expect(kycCaseRepository.require(managerCase.id).status).toBe("approved");
    expect(auditTrailFor("kyc_case", managerCase.id)[0]).toMatchObject({
      action: "kyc.case.decide",
      outcome: "success",
      actorRole: "manager",
      summary: "Decision approved: EDD complete",
    });
  });

  it("denies a scoped action whose record does not exist, instead of falling back to the role grant", async () => {
    currentActor = manager;

    const result = await addNote({ caseId: "case_does_not_exist", body: "probing" });

    expect(result).toMatchObject({ code: "unauthorized" });
    expect(auditTrailFor("kyc_case", "case_does_not_exist")[0]).toMatchObject({ outcome: "denied" });
  });

  it("awaits an async handler before auditing success", async () => {
    const { defineAction } = await import("@/platform/actions/define-action");
    const { z } = await import("zod");

    const action = defineAction({
      name: "kyc.case.note",
      permission: "kyc.case.note",
      input: z.object({ caseId: z.string() }),
      subject: ({ caseId }) => ({ type: "kyc_case", id: caseId }),
      handler: async () => {
        throw new Error("backend unavailable");
      },
      summary: () => "should not be audited as success",
    });

    const result = await action({ caseId: analystCase.id });

    expect(result).toMatchObject({ code: "failed" });
    expect(auditTrailFor("kyc_case", analystCase.id)[0]).toMatchObject({ outcome: "error" });
  });

  it("refuses a mutation a stale page offers on a closed case", async () => {
    currentActor = manager;

    const result = await escalateCase({ caseId: managerCase.id, reason: "second thoughts" });

    expect(result).toMatchObject({ code: "conflict" });
    expect(kycCaseRepository.require(managerCase.id).status).toBe("approved");
    expect(auditTrailFor("kyc_case", managerCase.id)[0]).toMatchObject({
      action: "kyc.case.escalate",
      outcome: "denied",
    });
  });
});
