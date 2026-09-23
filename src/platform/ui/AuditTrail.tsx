import type { AuditEvent } from "@/platform/audit/audit-log";
import { StatusBadge, type Tone } from "@/platform/ui/StatusBadge";

const OUTCOME_TONE: Record<AuditEvent["outcome"], Tone> = {
  success: "success",
  denied: "danger",
  error: "warning",
};

/**
 * Renders the platform audit trail for one record. Any tool gets this for free
 * because `defineAction()` writes the events.
 */
export function AuditTrail({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="border-l-2 border-slate-200 pl-3">
          <div className="flex items-center gap-2">
            <code className="text-xs text-slate-500">{event.action}</code>
            <StatusBadge label={event.outcome} tone={OUTCOME_TONE[event.outcome]} />
          </div>
          <p className="text-sm text-slate-800">{event.summary}</p>
          <p className="text-xs text-slate-500">
            {event.actorName} ({event.actorRole}) · {new Date(event.at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
