"use client";

import { useTransition } from "react";
import { switchPersona } from "@/platform/auth/actions";
import type { Actor } from "@/platform/authz/types";

/**
 * Demo affordance for the authentication stub: swap the signed-in user to show
 * role restrictions live. Removed once a real IdP provides the session.
 */
export function PersonaSwitcher({ actor, personas }: { actor: Actor; personas: Actor[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
        {actor.role}
      </span>
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <span className="hidden sm:inline">Signed in as</span>
        <select
          value={actor.id}
          disabled={pending}
          onChange={(event) => {
            const personaId = event.target.value;
            startTransition(() => {
              void switchPersona(personaId);
            });
          }}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm disabled:opacity-60"
        >
          {personas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.name} — {persona.title}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
