import Link from "next/link";
import { notFound } from "next/navigation";
import { auditTrailFor } from "@/platform/audit/audit-log";
import { PERSONAS } from "@/platform/auth/personas";
import { getCurrentActor } from "@/platform/auth/session";
import { AuditTrail } from "@/platform/ui/AuditTrail";
import { Can } from "@/platform/ui/Can";
import { PageHeader } from "@/platform/ui/PageHeader";
import { StatusBadge, type Tone } from "@/platform/ui/StatusBadge";
import { getVisibleCase } from "@/tools/kyc-review/queries";
import { STATUS_LABELS, isOpen, type KycCase } from "@/tools/kyc-review/domain";
import {
  AssignForm,
  ClaimButton,
  DecisionForm,
  EscalateForm,
  NoteForm,
} from "@/tools/kyc-review/components/CaseActionForms";

const STATUS_TONE: Record<KycCase["status"], Tone> = {
  new: "neutral",
  in_review: "info",
  info_requested: "warning",
  escalated: "danger",
  approved: "success",
  rejected: "danger",
};

const RISK_TONE: Record<KycCase["riskBand"], Tone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function KycCasePage({ params }: { params: { caseId: string } }) {
  const actor = getCurrentActor();
  const kycCase = getVisibleCase(actor, params.caseId);
  if (!kycCase) notFound();

  const events = auditTrailFor("kyc_case", kycCase.id);
  const assignee = PERSONAS.find((persona) => persona.id === kycCase.assigneeId);
  const open = isOpen(kycCase);

  return (
    <div className="space-y-5">
      <Link
        href="/tools/kyc-review"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <span aria-hidden>←</span> Back to queue
      </Link>

      <PageHeader
        eyebrow={kycCase.reference}
        title={kycCase.applicantAlias}
        description={`${kycCase.entityType === "business" ? "Business" : "Individual"} · ${kycCase.jurisdiction} · submitted ${new Date(kycCase.submittedAt).toLocaleDateString()}`}
        actions={
          <>
            <StatusBadge label={`${kycCase.riskBand} risk`} tone={RISK_TONE[kycCase.riskBand]} />
            <StatusBadge label={STATUS_LABELS[kycCase.status]} tone={STATUS_TONE[kycCase.status]} />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <div className="panel">
            <h2 className="panel-heading">Case summary</h2>
            <div className="p-4">
              <dl className="grid gap-4 sm:grid-cols-3">
                <Field label="Reference">
                  <span className="font-mono text-[13px]">{kycCase.reference}</span>
                </Field>
                <Field label="Entity type">
                  <span className="capitalize">{kycCase.entityType}</span>
                </Field>
                <Field label="Jurisdiction">{kycCase.jurisdiction}</Field>
                <Field label="Risk band">
                  <StatusBadge label={kycCase.riskBand} tone={RISK_TONE[kycCase.riskBand]} />
                </Field>
                <Field label="Status">
                  <StatusBadge label={STATUS_LABELS[kycCase.status]} tone={STATUS_TONE[kycCase.status]} />
                </Field>
                <Field label="Assignee">
                  {assignee ? (
                    `${assignee.name}${assignee.id === actor.id ? " (you)" : ""}`
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </Field>
              </dl>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                Synthetic case data only — no applicant PII is stored in this POC.
              </p>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-heading">Notes</h2>
            <div className="p-4">
              <ul className="space-y-3">
                {kycCase.notes.map((note) => (
                  <li key={note.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-800">{note.body}</p>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {note.authorName} · {new Date(note.at).toLocaleString()}
                    </p>
                  </li>
                ))}
                {kycCase.notes.length === 0 ? (
                  <li className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No notes yet.
                  </li>
                ) : null}
              </ul>
              {open ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Can actor={actor} permission="kyc.case.note" resource={kycCase}>
                    <NoteForm caseId={kycCase.id} />
                  </Can>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="panel">
            <h2 className="panel-heading">Actions</h2>
            <div className="divide-y divide-slate-100">
              {open ? (
                <>
                  {kycCase.assigneeId === null ? (
                    <Can actor={actor} permission="kyc.case.claim" resource={kycCase}>
                      <div className="p-4">
                        <ClaimButton caseId={kycCase.id} />
                      </div>
                    </Can>
                  ) : null}

                  <Can actor={actor} permission="kyc.case.escalate" resource={kycCase}>
                    <div className="p-4">
                      <p className="field-label">Escalation</p>
                      <div className="mt-2">
                        <EscalateForm caseId={kycCase.id} />
                      </div>
                    </div>
                  </Can>

                  <Can
                    actor={actor}
                    permission="kyc.case.decide"
                    resource={kycCase}
                    fallback={
                      <p className="p-4 text-xs text-slate-500">
                        Your role cannot approve or reject. Escalate instead — attempts are audited.
                      </p>
                    }
                  >
                    <div className="p-4">
                      <p className="field-label">Decision</p>
                      <div className="mt-2">
                        <DecisionForm caseId={kycCase.id} />
                      </div>
                    </div>
                  </Can>

                  <Can actor={actor} permission="kyc.case.assign" resource={kycCase}>
                    <div className="p-4">
                      <p className="field-label">Assignment</p>
                      <div className="mt-2">
                        <AssignForm
                          caseId={kycCase.id}
                          currentAssigneeId={kycCase.assigneeId}
                          assignees={PERSONAS.map((persona) => ({ id: persona.id, name: persona.name }))}
                        />
                      </div>
                    </div>
                  </Can>
                </>
              ) : (
                <p className="p-4 text-sm text-slate-500">
                  This case is closed. Decided cases are final and no further changes are accepted.
                </p>
              )}
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-heading">Audit trail</h2>
            <div className="p-4">
              <p className="mb-4 text-xs text-slate-500">
                Written automatically by the platform action wrapper.
              </p>
              <AuditTrail events={events} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
