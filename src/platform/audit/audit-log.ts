import { memoryStore } from "@/platform/data/memory-store";
import type { Actor } from "@/platform/authz/types";

export type AuditOutcome = "success" | "denied" | "error";

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  /** Action name, always the tool-owned dotted identifier, e.g. `kyc.case.approve`. */
  action: string;
  subjectType: string;
  subjectId: string;
  outcome: AuditOutcome;
  summary: string;
  metadata?: Record<string, unknown>;
}

const events = memoryStore<AuditEvent[]>("audit-events", () => []);

/**
 * Append-only audit sink. Callers should not use this directly: `defineAction()`
 * records every mutation, including denied attempts, so auditing is a property
 * of using the platform rather than something each tool remembers to do.
 *
 * Production: same event shape, different sink (Postgres table + log pipeline).
 */
export function recordAuditEvent(event: Omit<AuditEvent, "id" | "at">): AuditEvent {
  const stored: AuditEvent = {
    ...event,
    id: `ae_${events.length + 1}_${Date.now()}`,
    at: new Date().toISOString(),
  };
  events.push(stored);
  return stored;
}

export function auditTrailFor(subjectType: string, subjectId: string): AuditEvent[] {
  return events
    .filter((event) => event.subjectType === subjectType && event.subjectId === subjectId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function recentAuditEvents(limit = 50): AuditEvent[] {
  return [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export function describeActor(actor: Actor): Pick<AuditEvent, "actorId" | "actorName" | "actorRole"> {
  return { actorId: actor.id, actorName: actor.name, actorRole: actor.role };
}
