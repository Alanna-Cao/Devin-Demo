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
  "inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";
const inputClass = "field";

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
      {error}
    </p>
  ) : null;
}

export function ClaimButton({ caseId }: { caseId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-1">
      <button className={buttonClass} disabled={pending} onClick={() => run(() => claimCase({ caseId }))}>
        {pending ? "Claiming…" : "Claim case"}
      </button>
      <p className="text-xs text-slate-500">Takes ownership and moves the case into review.</p>
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
        rows={3}
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
          className="flex-1 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={pending || reason.trim() === ""}
          onClick={() => run(() => decideCase({ caseId, outcome: "approved", reason }), () => setReason(""))}
        >
          Approve
        </button>
        <button
          className="flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
