import { getCurrentActor } from "@/platform/auth/session";
import { PERSONAS } from "@/platform/auth/personas";
import { DataTable, type Column } from "@/platform/ui/DataTable";
import { FilterBar } from "@/platform/ui/FilterBar";
import { PageHeader } from "@/platform/ui/PageHeader";
import { StatusBadge, type Tone } from "@/platform/ui/StatusBadge";
import { listVisibleCases, type QueueFilters } from "@/tools/kyc-review/queries";
import { CASE_STATUSES, RISK_BANDS, STATUS_LABELS, type KycCase } from "@/tools/kyc-review/domain";

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

  const columns: Column<KycCase>[] = [
    { key: "reference", header: "Case", render: (row) => row.reference },
    { key: "applicant", header: "Applicant", render: (row) => row.applicantAlias },
    { key: "type", header: "Type", render: (row) => row.entityType },
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
    { key: "assignee", header: "Assignee", render: (row) => assigneeName(row.assigneeId) },
    {
      key: "submitted",
      header: "Submitted",
      render: (row) => new Date(row.submittedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="KYC Review Queue"
        description={
          actor.role === "analyst"
            ? "Your assigned cases plus anything unclaimed. Visibility is enforced server-side."
            : "All customer due-diligence cases."
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

      <p className="text-xs text-slate-500">{cases.length} case(s) visible to you</p>

      <DataTable
        rows={cases}
        columns={columns}
        rowHref={(row) => `/tools/kyc-review/${row.id}`}
        emptyMessage="No cases match these filters."
      />
    </div>
  );
}
