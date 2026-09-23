import Link from "next/link";
import { notFound } from "next/navigation";
import { auditTrailFor } from "@/platform/audit/audit-log";
import { getCurrentActor } from "@/platform/auth/session";
import { AuditTrail } from "@/platform/ui/AuditTrail";
import { Can } from "@/platform/ui/Can";
import { PageHeader } from "@/platform/ui/PageHeader";
import { StatusBadge, type Tone } from "@/platform/ui/StatusBadge";
import { getVisibleRefund } from "@/tools/refund-review/queries";
import {
  ADMIN_APPROVAL_THRESHOLD_CENTS,
  REASON_LABELS,
  STATUS_LABELS,
  formatAmount,
  isPending,
  requiresAdminApproval,
  type RefundRequest,
} from "@/tools/refund-review/domain";
import { RefundDecisionForm } from "@/tools/refund-review/components/RefundDecisionForm";

const STATUS_TONE: Record<RefundRequest["status"], Tone> = {
  pending: "info",
  approved: "success",
  rejected: "danger",
};

const THRESHOLD_LABEL = formatAmount({
  amountCents: ADMIN_APPROVAL_THRESHOLD_CENTS,
  currency: "USD",
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function RefundDetailPage({ params }: { params: { refundId: string } }) {
  const actor = getCurrentActor();
  const refund = getVisibleRefund(actor, params.refundId);
  if (!refund) notFound();

  const events = auditTrailFor("refund_request", refund.id);
  const pending = isPending(refund);
  const adminOnly = requiresAdminApproval(refund);

  return (
    <div className="space-y-5">
      <Link
        href="/tools/refund-review"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <span aria-hidden>←</span> Back to queue
      </Link>

      <PageHeader
        eyebrow={refund.reference}
        title={`${formatAmount(refund)} · ${refund.customerAlias}`}
        description={`${REASON_LABELS[refund.reason]} · requested ${new Date(refund.requestedAt).toLocaleDateString()} by ${refund.requestedBy}`}
        actions={
          <>
            {adminOnly ? <StatusBadge label="admin approval" tone="warning" /> : null}
            <StatusBadge label={STATUS_LABELS[refund.status]} tone={STATUS_TONE[refund.status]} />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <div className="panel">
            <h2 className="panel-heading">Request summary</h2>
            <div className="p-4">
              <dl className="grid gap-4 sm:grid-cols-3">
                <Field label="Reference">
                  <span className="font-mono text-[13px]">{refund.reference}</span>
                </Field>
                <Field label="Customer">{refund.customerAlias}</Field>
                <Field label="Transaction">
                  <span className="font-mono text-[13px]">{refund.transactionRef}</span>
                </Field>
                <Field label="Amount">
                  <span className="font-medium">{formatAmount(refund)}</span>
                </Field>
                <Field label="Refund reason">{REASON_LABELS[refund.reason]}</Field>
                <Field label="Requested">
                  {new Date(refund.requestedAt).toLocaleDateString()} · {refund.requestedBy}
                </Field>
                <Field label="Status">
                  <StatusBadge label={STATUS_LABELS[refund.status]} tone={STATUS_TONE[refund.status]} />
                </Field>
                <Field label="Approval authority">
                  {adminOnly ? `Admin only (≥ ${THRESHOLD_LABEL})` : `Compliance Manager or Admin`}
                </Field>
              </dl>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                Synthetic refund data only — no customer PII is stored in this POC.
              </p>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-heading">Decision</h2>
            <div className="p-4">
              {refund.decision ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <StatusBadge
                    label={STATUS_LABELS[refund.decision.outcome]}
                    tone={STATUS_TONE[refund.decision.outcome]}
                  />
                  <p className="mt-2 text-sm text-slate-800">{refund.decision.reason}</p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {refund.decision.deciderName} · {new Date(refund.decision.at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Awaiting a decision.</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="panel">
            <h2 className="panel-heading">Actions</h2>
            <div className="divide-y divide-slate-100">
              {pending ? (
                <Can
                  actor={actor}
                  permission="refunds.request.decide"
                  resource={refund}
                  fallback={
                    <p className="p-4 text-xs text-slate-500">
                      {adminOnly
                        ? `Refunds of ${THRESHOLD_LABEL} or more require an Admin. Attempts by other roles are refused server-side and audited.`
                        : "Your role cannot approve or reject refunds. Attempts are refused server-side and audited."}
                    </p>
                  }
                >
                  <div className="p-4">
                    <p className="field-label">Decision</p>
                    <div className="mt-2">
                      <RefundDecisionForm refundId={refund.id} />
                    </div>
                  </div>
                </Can>
              ) : (
                <p className="p-4 text-sm text-slate-500">
                  This refund has already been decided. Decisions are final and no further changes are accepted.
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
