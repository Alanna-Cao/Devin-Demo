/**
 * Action definitions for this tool.
 *
 * Deliberately NOT a `"use server"` module: Next.js turns every function in
 * such a module — including the callbacks passed to `defineAction()` — into a
 * separately addressable server action, which both breaks them (they come back
 * as promises) and exposes unauthorized handlers over HTTP. The thin `"use
 * server"` wrappers the UI calls live in `server-actions.ts`.
 */
import { z } from "zod";
import { defineAction } from "@/platform/actions/define-action";
import { kycCaseRepository } from "@/tools/kyc-review/data";
import { isOpen, type KycCase } from "@/tools/kyc-review/domain";

const caseRef = z.object({ caseId: z.string().min(1) });

const TOOL_PATH = "/tools/kyc-review";

/** Decided cases are final; a stale page must not be able to reopen one. */
const mustBeOpen = ({ resource }: { resource: unknown }) =>
  isOpen(resource as KycCase) ? null : "This case is already closed.";

/** Take ownership of an unclaimed case. */
export const claimCase = defineAction({
  name: "kyc.case.claim",
  permission: "kyc.case.claim",
  input: caseRef,
  subject: ({ caseId }) => ({ type: "kyc_case", id: caseId }),
  loadResource: ({ caseId }) => kycCaseRepository.get(caseId),
  precondition: mustBeOpen,
  handler: ({ actor, input }) =>
    kycCaseRepository.update(input.caseId, (kycCase) => ({
      ...kycCase,
      assigneeId: actor.id,
      status: kycCase.status === "new" ? "in_review" : kycCase.status,
    })),
  summary: ({ actor }) => `Claimed by ${actor.name}`,
  revalidate: [TOOL_PATH],
});

export const addNote = defineAction({
  name: "kyc.case.note",
  permission: "kyc.case.note",
  input: caseRef.extend({ body: z.string().min(1, "Note cannot be empty").max(500) }),
  subject: ({ caseId }) => ({ type: "kyc_case", id: caseId }),
  loadResource: ({ caseId }) => kycCaseRepository.get(caseId),
  precondition: mustBeOpen,
  handler: ({ actor, input }) =>
    kycCaseRepository.update(input.caseId, (kycCase) => ({
      ...kycCase,
      notes: [
        ...kycCase.notes,
        {
          id: `note_${kycCase.notes.length + 1}`,
          authorName: actor.name,
          body: input.body,
          at: new Date().toISOString(),
        },
      ],
    })),
  summary: ({ input }) => `Note added: ${input.body.slice(0, 80)}`,
  revalidate: [TOOL_PATH],
});

/** Analysts cannot decide, but they can push a case up for a manager. */
export const escalateCase = defineAction({
  name: "kyc.case.escalate",
  permission: "kyc.case.escalate",
  input: caseRef.extend({ reason: z.string().min(1, "Give a reason").max(300) }),
  subject: ({ caseId }) => ({ type: "kyc_case", id: caseId }),
  loadResource: ({ caseId }) => kycCaseRepository.get(caseId),
  precondition: mustBeOpen,
  handler: ({ input }) =>
    kycCaseRepository.update(input.caseId, (kycCase) => ({ ...kycCase, status: "escalated" })),
  summary: ({ input }) => `Escalated: ${input.reason}`,
  revalidate: [TOOL_PATH],
});

export const decideCase = defineAction({
  name: "kyc.case.decide",
  permission: "kyc.case.decide",
  input: caseRef.extend({
    outcome: z.enum(["approved", "rejected"]),
    reason: z.string().min(1, "A decision needs a reason").max(300),
  }),
  subject: ({ caseId }) => ({ type: "kyc_case", id: caseId }),
  loadResource: ({ caseId }) => kycCaseRepository.get(caseId),
  precondition: mustBeOpen,
  handler: ({ input }) =>
    kycCaseRepository.update(input.caseId, (kycCase) => ({ ...kycCase, status: input.outcome })),
  summary: ({ input }) => `Decision ${input.outcome}: ${input.reason}`,
  revalidate: [TOOL_PATH],
});

export const assignCase = defineAction({
  name: "kyc.case.assign",
  permission: "kyc.case.assign",
  input: caseRef.extend({ assigneeId: z.string().min(1) }),
  subject: ({ caseId }) => ({ type: "kyc_case", id: caseId }),
  loadResource: ({ caseId }) => kycCaseRepository.get(caseId),
  precondition: mustBeOpen,
  handler: ({ input }) =>
    kycCaseRepository.update(input.caseId, (kycCase) => ({ ...kycCase, assigneeId: input.assigneeId })),
  summary: ({ input }) => `Assigned to ${input.assigneeId}`,
  revalidate: [TOOL_PATH],
});
