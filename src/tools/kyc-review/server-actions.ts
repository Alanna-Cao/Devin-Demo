"use server";

import * as actions from "@/tools/kyc-review/actions";

/**
 * The tool's server-action surface: one thin async wrapper per action, and
 * nothing else. Keeping the `defineAction()` definitions out of this module is
 * what stops Next.js from publishing their internal callbacks (handlers,
 * resource loaders) as separately callable endpoints.
 */

export async function claimCase(input: { caseId: string }) {
  return actions.claimCase(input);
}

export async function addNote(input: { caseId: string; body: string }) {
  return actions.addNote(input);
}

export async function escalateCase(input: { caseId: string; reason: string }) {
  return actions.escalateCase(input);
}

export async function decideCase(input: { caseId: string; outcome: "approved" | "rejected"; reason: string }) {
  return actions.decideCase(input);
}

export async function assignCase(input: { caseId: string; assigneeId: string }) {
  return actions.assignCase(input);
}
