import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getCurrentActor } from "@/platform/auth/session";
import { can } from "@/platform/authz/policy";
import type { Actor, Permission } from "@/platform/authz/types";
import { describeActor, recordAuditEvent } from "@/platform/audit/audit-log";

export type ActionResult<TOutput> =
  | { ok: true; data: TOutput }
  | { ok: false; error: string; code: "unauthorized" | "invalid_input" | "conflict" | "failed" };

export interface ActionDefinition<TSchema extends z.ZodTypeAny, TOutput> {
  /** Dotted, tool-owned name. Doubles as the audit action, e.g. `kyc.case.approve`. */
  name: string;
  permission: Permission;
  input: TSchema;
  /** What the action acts on, for the audit trail and resource-level authorization. */
  subject: (input: z.infer<TSchema>) => { type: string; id: string };
  /**
   * Loads the record being acted on so the policy engine can apply its
   * resource-level scope rule (e.g. "analysts only act on their own cases").
   */
  loadResource?: (input: z.infer<TSchema>) => unknown;
  /**
   * Business-rule check run after authorization, against the state the server
   * sees right now. Return a message to refuse the mutation; UI gating alone
   * cannot be trusted, because a stale page still holds a live action handle.
   */
  precondition?: (context: { actor: Actor; input: z.infer<TSchema>; resource: unknown }) => string | null;
  handler: (context: { actor: Actor; input: z.infer<TSchema> }) => TOutput | Promise<TOutput>;
  /** One-line human description stored on the audit event. */
  summary: (context: { actor: Actor; input: z.infer<TSchema> }) => string;
  /** Paths to revalidate after a successful mutation. */
  revalidate?: string[];
}

/**
 * The only way tools should mutate state.
 *
 * Every call runs the same pipeline: resolve actor -> validate input ->
 * authorize (role grant + resource scope) -> check preconditions -> execute ->
 * write an audit event.
 * Denied and failed attempts are audited too, so authorization and auditing
 * cannot be forgotten by a tool author.
 */
export function defineAction<TSchema extends z.ZodTypeAny, TOutput>(
  definition: ActionDefinition<TSchema, TOutput>,
) {
  /**
   * Guards the one way this wrapper can be defeated: defining actions inside a
   * `"use server"` module turns these callbacks into server-action references
   * that return promises, which would silently reduce every authorization
   * check to a deny. Fail loudly instead.
   */
  function assertSync<T>(value: T, callback: string): T {
    if (value instanceof Promise) {
      throw new Error(
        `${definition.name}: ${callback}() returned a promise. Define actions outside a "use server" module.`,
      );
    }
    return value;
  }

  return async function runAction(rawInput: unknown): Promise<ActionResult<TOutput>> {
    const actor = getCurrentActor();

    const parsed = definition.input.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, code: "invalid_input", error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const input = parsed.data as z.infer<TSchema>;
    const subject = assertSync(definition.subject(input), "subject");

    const resource = assertSync(definition.loadResource?.(input), "loadResource");
    // A scoped action whose record is missing must not fall back to the
    // role-only check: without the record there is nothing to scope against.
    // It is reported as unauthorized so ids cannot be probed for existence.
    const missingResource = definition.loadResource !== undefined && resource == null;
    if (missingResource || !can(actor, definition.permission, resource)) {
      recordAuditEvent({
        ...describeActor(actor),
        action: definition.name,
        subjectType: subject.type,
        subjectId: subject.id,
        outcome: "denied",
        summary: missingResource
          ? `Denied: ${subject.type} ${subject.id} not found`
          : `Denied: missing ${definition.permission}`,
      });
      return { ok: false, code: "unauthorized", error: "You do not have permission to do that." };
    }

    const conflict = assertSync(
      definition.precondition?.({ actor, input, resource }) ?? null,
      "precondition",
    );
    if (conflict) {
      recordAuditEvent({
        ...describeActor(actor),
        action: definition.name,
        subjectType: subject.type,
        subjectId: subject.id,
        outcome: "denied",
        summary: `Refused: ${conflict}`,
      });
      return { ok: false, code: "conflict", error: conflict };
    }

    try {
      const data = await definition.handler({ actor, input });
      recordAuditEvent({
        ...describeActor(actor),
        action: definition.name,
        subjectType: subject.type,
        subjectId: subject.id,
        outcome: "success",
        summary: definition.summary({ actor, input }),
      });
      for (const path of definition.revalidate ?? []) revalidatePath(path, "layout");
      return { ok: true, data };
    } catch (error) {
      recordAuditEvent({
        ...describeActor(actor),
        action: definition.name,
        subjectType: subject.type,
        subjectId: subject.id,
        outcome: "error",
        summary: error instanceof Error ? error.message : "Action failed",
      });
      return { ok: false, code: "failed", error: "Something went wrong. The attempt was logged." };
    }
  };
}
