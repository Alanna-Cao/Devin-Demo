"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/platform/actions/define-action";
import { addNote, assignCase, claimCase, decideCase, escalateCase } from "@/tools/kyc-review/server-actions";

/**
 * Thin client wrappers around the tool's server actions. They render the
 * result of `defineAction()` uniformly, including the "not authorized" path a
 * persona hits if they call an action they cannot see the button for.
 */
function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult<unknown>>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error);
      else onDone?.();
    });
  }

  return { pending, error, run };
}

const buttonClass =
  "rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50";
const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

function ErrorText({ error }: { error: string | null }) {
  return error ? <p className="text-sm text-red-700">{error}</p> : null;
}

export function ClaimButton({ caseId }: { caseId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-1">
      <button className={buttonClass} disabled={pending} onClick={() => run(() => claimCase({ caseId }))}>
        Claim case
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function NoteForm({ caseId }: { caseId: string }) {
  const { pending, error, run } = useAction();
  const [body, setBody] = useState("");
  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        placeholder="Add a review note…"
        className={inputClass}
      />
      <button
        className={buttonClass}
        disabled={pending || body.trim() === ""}
        onClick={() => run(() => addNote({ caseId, body }), () => setBody(""))}
      >
        Add note
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function EscalateForm({ caseId }: { caseId: string }) {
  const { pending, error, run } = useAction();
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason for escalation"
        className={inputClass}
      />
      <button
        className={buttonClass}
        disabled={pending || reason.trim() === ""}
        onClick={() => run(() => escalateCase({ caseId, reason }), () => setReason(""))}
      >
        Escalate to manager
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function DecisionForm({ caseId }: { caseId: string }) {
  const { pending, error, run } = useAction();
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Decision rationale"
        className={inputClass}
      />
      <div className="flex gap-2">
        <button
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={pending || reason.trim() === ""}
          onClick={() => run(() => decideCase({ caseId, outcome: "approved", reason }), () => setReason(""))}
        >
          Approve
        </button>
        <button
          className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={pending || reason.trim() === ""}
          onClick={() => run(() => decideCase({ caseId, outcome: "rejected", reason }), () => setReason(""))}
        >
          Reject
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}

export function AssignForm({
  caseId,
  assignees,
  currentAssigneeId,
}: {
  caseId: string;
  assignees: { id: string; name: string }[];
  currentAssigneeId: string | null;
}) {
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-1">
      <select
        defaultValue={currentAssigneeId ?? ""}
        disabled={pending}
        onChange={(event) => run(() => assignCase({ caseId, assigneeId: event.target.value }))}
        className={inputClass}
      >
        <option value="" disabled>
          Assign to…
        </option>
        {assignees.map((assignee) => (
          <option key={assignee.id} value={assignee.id}>
            {assignee.name}
          </option>
        ))}
      </select>
      <ErrorText error={error} />
    </div>
  );
}
