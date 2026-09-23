"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PERSONA_COOKIE } from "@/platform/auth/session";
import { findPersona } from "@/platform/auth/personas";

/**
 * Demo-only: swaps the active persona. Deleted when a real IdP is wired in.
 */
export async function switchPersona(personaId: string): Promise<void> {
  const persona = findPersona(personaId);
  cookies().set(PERSONA_COOKIE, persona.id, { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
}
