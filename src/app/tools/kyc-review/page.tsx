import { getCurrentActor } from "@/platform/auth/session";
import { PERSONAS } from "@/platform/auth/personas";
import { DataTable, type Column } from "@/platform/ui/DataTable";
import { FilterBar } from "@/platform/ui/FilterBar";
import { PageHeader } from "@/platform/ui/PageHeader";
import { StatusBadge, type Tone } from "@/platform/ui/StatusBadge";
import { listVisibleCases, type QueueFilters } from "@/tools/kyc-review/queries";
import { CASE_STATUSES, RISK_BANDS, STATUS_LABELS, isOpen, type KycCase } from "@/tools/kyc-review/domain";

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

function assigneeName(assigneeId: string | null): string {
  if (!assigneeId) return "Unassigned";
  return PERSONAS.find((persona) => persona.id === assigneeId)?.name ?? assigneeId;
}

export default function KycQueuePage({ searchParams }: { searchParams: QueueFilters }) {
  const actor = getCurrentActor();
  const cases = listVisibleCases(actor, searchParams);
  const openCount = cases.filter(isOpen).length;

  const columns: Column<KycCase>[] = [
    {
      key: "reference",
      header: "Case",
      render: (row) => <span className="font-mono text-[13px]">{row.reference}</span>,
    },
    {
      key: "applicant",
      header: "Applicant",
      render: (row) => <span className="text-slate-900">{row.applicantAlias}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="capitalize">{row.entityType}</span>,
    },
    { key: "jurisdiction", header: "Jurisdiction", render: (row) => row.jurisdiction },
    {
      key: "risk",
      header: "Risk",
      render: (row) => <StatusBadge label={row.riskBand} tone={RISK_TONE[row.riskBand]} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={STATUS_LABELS[row.status]} tone={STATUS_TONE[row.status]} />,
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (row) =>
        row.assigneeId === null ? (
          <span className="text-slate-400">Unassigned</span>
        ) : (
          <span>{row.assigneeId === actor.id ? "You" : assigneeName(row.assigneeId)}</span>
        ),
    },
    {
      key: "submitted",
      header: "Submitted",
      className: "text-right",
      render: (row) => (
        <span className="text-slate-500">{new Date(row.submittedAt).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Compliance"
        title="KYC Review Queue"
        description={
          actor.role === "analyst"
            ? "Your assigned cases plus anything unclaimed. Visibility is enforced server-side."
            : "All customer due-diligence cases."
        }
        actions={
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Visible</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{cases.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Open</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{openCount}</p>
            </div>
          </div>
        }
      />

      <FilterBar
        searchPlaceholder="Applicant or case reference"
        filters={[
          {
            name: "status",
            label: "Status",
            options: CASE_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
          },
          {
            name: "risk",
            label: "Risk band",
            options: RISK_BANDS.map((band) => ({ value: band, label: band })),
          },
          { name: "mine", label: "Assignment", options: [{ value: "1", label: "Assigned to me" }] },
        ]}
      />

      <DataTable
        rows={cases}
        columns={columns}
        rowHref={(row) => `/tools/kyc-review/${row.id}`}
        emptyMessage="No cases match these filters."
      />
    </div>
  );
}
