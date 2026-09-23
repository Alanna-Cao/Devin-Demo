import type { Actor } from "@/platform/authz/types";

/**
 * Stubbed directory of users. In production this is replaced by the identity
 * provider: `getCurrentActor()` maps an OIDC session (Entra ID groups -> role)
 * onto this same `Actor` shape, and nothing downstream changes.
 */
export const PERSONAS: Actor[] = [
  {
    id: "u_admin",
    name: "Dana Okafor",
    title: "Platform Admin",
    role: "admin",
  },
  {
    id: "u_manager",
    name: "Priya Raman",
    title: "Compliance Manager",
    role: "manager",
  },
  {
    id: "u_analyst",
    name: "Sam Ellis",
    title: "KYC Analyst",
    role: "analyst",
  },
];

export const DEFAULT_PERSONA_ID = "u_analyst";

export function findPersona(id: string | undefined): Actor {
  return PERSONAS.find((persona) => persona.id === id) ?? PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID)!;
}
