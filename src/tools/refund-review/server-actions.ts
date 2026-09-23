"use server";

import * as actions from "@/tools/refund-review/actions";

/**
 * The tool's server-action surface: one thin async wrapper per action, and
 * nothing else.
 */

export async function decideRefund(input: {
  refundId: string;
  outcome: "approved" | "rejected";
  reason: string;
}) {
  return actions.decideRefund(input);
}
