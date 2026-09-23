import { getCurrentActor } from "@/platform/auth/session";
import { DataTable, type Column } from "@/platform/ui/DataTable";
import { FilterBar } from "@/platform/ui/FilterBar";
import { PageHeader } from "@/platform/ui/PageHeader";
import { StatusBadge, type Tone } from "@/platform/ui/StatusBadge";
import { listVisibleRefunds, type QueueFilters } from "@/tools/refund-review/queries";
import {
  REASON_LABELS,
  REFUND_REASONS,
  REFUND_STATUSES,
  STATUS_LABELS,
  formatAmount,
  isPending,
  requiresAdminApproval,
  type RefundRequest,
} from "@/tools/refund-review/domain";

const STATUS_TONE: Record<RefundRequest["status"], Tone> = {
  pending: "info",
  approved: "success",
  rejected: "danger",
};

export default function RefundQueuePage({ searchParams }: { searchParams: QueueFilters }) {
  const actor = getCurrentActor();
  const refunds = listVisibleRefunds(actor, searchParams);
  const pendingCount = refunds.filter(isPending).length;

  const columns: Column<RefundRequest>[] = [
    {
      key: "reference",
      header: "Refund",
      render: (row) => <span className="font-mono text-[13px]">{row.reference}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => <span className="text-slate-900">{row.customerAlias}</span>,
    },
    {
      key: "transaction",
      header: "Transaction",
      render: (row) => <span className="font-mono text-[13px] text-slate-600">{row.transactionRef}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <span className="font-medium text-slate-900">
          {formatAmount(row)}
          {requiresAdminApproval(row) ? (
            <span className="ml-2 align-middle">
              <StatusBadge label="admin approval" tone="warning" dot={false} />
            </span>
          ) : null}
        </span>
      ),
    },
    { key: "reason", header: "Reason", render: (row) => REASON_LABELS[row.reason] },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={STATUS_LABELS[row.status]} tone={STATUS_TONE[row.status]} />,
    },
    {
      key: "requested",
      header: "Requested",
      className: "text-right",
      render: (row) => (
        <span className="text-slate-500">{new Date(row.requestedAt).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Payments"
        title="Refund Review"
        description="Customer refund requests awaiting a decision. Approval authority depends on the refund amount."
        actions={
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Visible</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{refunds.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{pendingCount}</p>
            </div>
          </div>
        }
      />

      <FilterBar
        searchPlaceholder="Customer, refund or transaction reference"
        filters={[
          {
            name: "status",
            label: "Status",
            options: REFUND_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
          },
          {
            name: "reason",
            label: "Reason",
            options: REFUND_REASONS.map((reason) => ({ value: reason, label: REASON_LABELS[reason] })),
          },
        ]}
      />

      <DataTable
        rows={refunds}
        columns={columns}
        rowHref={(row) => `/tools/refund-review/${row.id}`}
        emptyMessage="No refund requests match these filters."
      />
    </div>
  );
}
