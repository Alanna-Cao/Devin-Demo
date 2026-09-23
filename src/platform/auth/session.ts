import { cookies } from "next/headers";
import { DEFAULT_PERSONA_ID, findPersona } from "@/platform/auth/personas";
import type { Actor } from "@/platform/authz/types";

export const PERSONA_COOKIE = "poc_persona";

/**
 * The single authentication boundary for the whole platform.
 *
 * POC: resolves a persona from a cookie so the demo can switch roles live.
 * Production: replace the body with a real session lookup (Auth.js / OIDC
 * against the corporate IdP). Every caller keeps working because they only
 * depend on the `Actor` shape.
 */
export function getCurrentActor(): Actor {
  const cookieStore = cookies();
  return findPersona(cookieStore.get(PERSONA_COOKIE)?.value ?? DEFAULT_PERSONA_ID);
}
