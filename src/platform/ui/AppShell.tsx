import Link from "next/link";
import type { ReactNode } from "react";
import { PERSONAS } from "@/platform/auth/personas";
import { getCurrentActor } from "@/platform/auth/session";
import { can } from "@/platform/authz/policy";
import { getRegisteredTools } from "@/platform/registry/registry";
import { PersonaSwitcher } from "@/platform/ui/PersonaSwitcher";

/**
 * Chrome shared by every tool. Navigation is derived from the tool registry
 * and filtered by the policy engine, so a tool a persona cannot access is not
 * advertised to them.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const actor = getCurrentActor();
  const tools = getRegisteredTools().filter((tool) => can(actor, tool.requiredPermission));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
        <Link href="/" className="block text-sm font-semibold text-slate-900">
          Internal Tools
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">Platform POC</p>
        <nav className="mt-6 space-y-1">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <span aria-hidden>{tool.glyph}</span>
              {tool.title}
            </Link>
          ))}
          {tools.length === 0 ? (
            <p className="px-2 text-sm text-slate-500">No tools available for this role.</p>
          ) : null}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm font-medium text-slate-700">{actor.title}</span>
          <PersonaSwitcher actor={actor} personas={PERSONAS} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
