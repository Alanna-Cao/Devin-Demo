/**
 * Action definitions for this tool. Deliberately NOT a `"use server"` module —
 * see `server-actions.ts` and `defineAction()` for why.
 */
import { z } from "zod";
import { defineAction } from "@/platform/actions/define-action";
import { refundRepository } from "@/tools/refund-review/data";
import { isPending, type RefundRequest } from "@/tools/refund-review/domain";

const TOOL_PATH = "/tools/refund-review";

export const decideRefund = defineAction({
  name: "refunds.request.decide",
  permission: "refunds.request.decide",
  input: z.object({
    refundId: z.string().min(1),
    outcome: z.enum(["approved", "rejected"]),
    reason: z.string().min(1, "A decision needs a reason").max(300),
  }),
  subject: ({ refundId }) => ({ type: "refund_request", id: refundId }),
  loadResource: ({ refundId }) => refundRepository.get(refundId),
  /** A refund is decided once; a stale page must not overturn an outcome. */
  precondition: ({ resource }) =>
    isPending(resource as RefundRequest) ? null : "This refund has already been decided.",
  handler: ({ actor, input }) =>
    refundRepository.update(input.refundId, (refund) => ({
      ...refund,
      status: input.outcome,
      decision: {
        outcome: input.outcome,
        reason: input.reason,
        deciderId: actor.id,
        deciderName: actor.name,
        at: new Date().toISOString(),
      },
    })),
  summary: ({ input }) => `Decision ${input.outcome}: ${input.reason}`,
  revalidate: [TOOL_PATH],
});
