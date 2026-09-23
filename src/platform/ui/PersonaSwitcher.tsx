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
    <label className="flex items-center gap-2 text-xs text-slate-500">
      Signed in as
      <select
        value={actor.id}
        disabled={pending}
        onChange={(event) => {
          const personaId = event.target.value;
          startTransition(() => {
            void switchPersona(personaId);
          });
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
      >
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.name} — {persona.title}
          </option>
        ))}
      </select>
    </label>
  );
}
