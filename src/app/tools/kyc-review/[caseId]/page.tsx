import Link from "next/link";
import { notFound } from "next/navigation";
import { auditTrailFor } from "@/platform/audit/audit-log";
import { PERSONAS } from "@/platform/auth/personas";
import { getCurrentActor } from "@/platform/auth/session";
import { AuditTrail } from "@/platform/ui/AuditTrail";
import { Can } from "@/platform/ui/Can";
import { PageHeader } from "@/platform/ui/PageHeader";
import { StatusBadge } from "@/platform/ui/StatusBadge";
import { getVisibleCase } from "@/tools/kyc-review/queries";
import { STATUS_LABELS, isOpen } from "@/tools/kyc-review/domain";
import {
  AssignForm,
  ClaimButton,
  DecisionForm,
  EscalateForm,
  NoteForm,
} from "@/tools/kyc-review/components/CaseActionForms";

export default function KycCasePage({ params }: { params: { caseId: string } }) {
  const actor = getCurrentActor();
  const kycCase = getVisibleCase(actor, params.caseId);
  if (!kycCase) notFound();

  const events = auditTrailFor("kyc_case", kycCase.id);
  const assignee = PERSONAS.find((persona) => persona.id === kycCase.assigneeId);

  return (
    <div className="space-y-5">
      <Link href="/tools/kyc-review" className="text-sm text-blue-700 hover:underline">
        ← Back to queue
      </Link>

      <PageHeader
        title={`${kycCase.reference} · ${kycCase.applicantAlias}`}
        description={`${kycCase.entityType} · ${kycCase.jurisdiction} · submitted ${new Date(kycCase.submittedAt).toLocaleDateString()}`}
        actions={<StatusBadge label={STATUS_LABELS[kycCase.status]} tone="info" />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Case summary</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Risk band</dt>
                <dd>{kycCase.riskBand}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Assignee</dt>
                <dd>{assignee?.name ?? "Unassigned"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              Synthetic case data only — no applicant PII is stored in this POC.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
            <ul className="mt-3 space-y-2">
              {kycCase.notes.map((note) => (
                <li key={note.id} className="rounded bg-slate-50 p-2 text-sm">
                  <p>{note.body}</p>
                  <p className="text-xs text-slate-500">
                    {note.authorName} · {new Date(note.at).toLocaleString()}
                  </p>
                </li>
              ))}
              {kycCase.notes.length === 0 ? <li className="text-sm text-slate-500">No notes yet.</li> : null}
            </ul>
            <div className="mt-3">
              <Can actor={actor} permission="kyc.case.note" resource={kycCase}>
                <NoteForm caseId={kycCase.id} />
              </Can>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Actions</h2>

            {isOpen(kycCase) ? (
              <>
                {kycCase.assigneeId === null ? (
                  <Can actor={actor} permission="kyc.case.claim" resource={kycCase}>
                    <ClaimButton caseId={kycCase.id} />
                  </Can>
                ) : null}

                <Can actor={actor} permission="kyc.case.escalate" resource={kycCase}>
                  <EscalateForm caseId={kycCase.id} />
                </Can>

                <Can
                  actor={actor}
                  permission="kyc.case.decide"
                  resource={kycCase}
                  fallback={
                    <p className="text-xs text-slate-500">
                      Your role cannot approve or reject. Escalate instead — attempts are audited.
                    </p>
                  }
                >
                  <DecisionForm caseId={kycCase.id} />
                </Can>

                <Can actor={actor} permission="kyc.case.assign" resource={kycCase}>
                  <AssignForm
                    caseId={kycCase.id}
                    currentAssigneeId={kycCase.assigneeId}
                    assignees={PERSONAS.map((persona) => ({ id: persona.id, name: persona.name }))}
                  />
                </Can>
              </>
            ) : (
              <p className="text-sm text-slate-500">This case is closed.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Audit trail</h2>
            <p className="mb-3 text-xs text-slate-500">Written automatically by the platform action wrapper.</p>
            <AuditTrail events={events} />
          </div>
        </section>
      </div>
    </div>
  );
}
