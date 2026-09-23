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
    <ol className="space-y-4 border-l border-slate-200 pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-white bg-slate-300"
          />
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
              {event.action}
            </code>
            <StatusBadge label={event.outcome} tone={OUTCOME_TONE[event.outcome]} />
          </div>
          <p className="mt-1 text-sm text-slate-800">{event.summary}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {event.actorName} ({event.actorRole}) · {new Date(event.at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
