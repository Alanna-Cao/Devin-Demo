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
const { addNote, decideCase } = await import("@/tools/kyc-review/actions");

const analyst = PERSONAS.find((p) => p.role === "analyst")!;
const manager = PERSONAS.find((p) => p.role === "manager")!;

const analystCase = kycCaseRepository.list().find((c) => c.assigneeId === analyst.id && c.status === "in_review")!;
const managerCase = kycCaseRepository.list().find((c) => c.assigneeId === manager.id && c.status === "in_review")!;

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
});
