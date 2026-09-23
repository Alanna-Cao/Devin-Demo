import { describe, expect, it } from "vitest";
import { can, permissionsFor } from "@/platform/authz/policy";
import { PERSONAS } from "@/platform/auth/personas";
import { kycCaseRepository } from "@/tools/kyc-review/data";
import type { Actor } from "@/platform/authz/types";

const admin = PERSONAS.find((p) => p.role === "admin") as Actor;
const manager = PERSONAS.find((p) => p.role === "manager") as Actor;
const analyst = PERSONAS.find((p) => p.role === "analyst") as Actor;

const assignedToAnalyst = kycCaseRepository.list().find((c) => c.assigneeId === analyst.id)!;
const assignedToManager = kycCaseRepository.list().find((c) => c.assigneeId === manager.id)!;
const unassigned = kycCaseRepository.list().find((c) => c.assigneeId === null)!;

describe("policy engine", () => {
  it("denies permissions no policy module grants", () => {
    expect(can(admin, "kyc.case.destroy")).toBe(false);
  });

  it("grants deciding to managers and admins only", () => {
    expect(can(manager, "kyc.case.decide")).toBe(true);
    expect(can(admin, "kyc.case.decide")).toBe(true);
    expect(can(analyst, "kyc.case.decide")).toBe(false);
  });

  it("narrows analyst case access to their own and unclaimed cases", () => {
    expect(can(analyst, "kyc.case.read", assignedToAnalyst)).toBe(true);
    expect(can(analyst, "kyc.case.read", unassigned)).toBe(true);
    expect(can(analyst, "kyc.case.read", assignedToManager)).toBe(false);
  });

  it("does not apply resource scopes to managers and admins", () => {
    expect(can(manager, "kyc.case.read", assignedToAnalyst)).toBe(true);
    expect(can(admin, "kyc.case.read", assignedToAnalyst)).toBe(true);
  });

  it("composes tool permissions into the effective permission set", () => {
    expect(permissionsFor(analyst)).toContain("kyc.case.note");
    expect(permissionsFor(analyst)).not.toContain("kyc.case.assign");
    expect(permissionsFor(admin)).toContain("platform.audit.read");
  });
});
