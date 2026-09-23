"use client";

import { useRef, useState } from "react";
import type { ActionResult } from "@/platform/actions/define-action";
import { decideRefund } from "@/tools/refund-review/server-actions";

/**
 * Client wrapper around the tool's decision action. Renders the result of
 * `defineAction()` uniformly, including the denial a persona hits when it
 * calls an action it cannot see the button for.
 */
export function RefundDecisionForm({ refundId }: { refundId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const inFlight = useRef(false);

  async function run(fn: () => Promise<ActionResult<unknown>>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await fn();
      if (!result.ok) setError(result.error);
      else setReason("");
    } catch {
      setError("Could not reach the server. Nothing was changed.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Decision rationale"
        className="field"
      />
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={pending || reason.trim() === ""}
          onClick={() => run(() => decideRefund({ refundId, outcome: "approved", reason }))}
        >
          Approve refund
        </button>
        <button
          className="flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={pending || reason.trim() === ""}
          onClick={() => run(() => decideRefund({ refundId, outcome: "rejected", reason }))}
        >
          Reject
        </button>
      </div>
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
