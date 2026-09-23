import Link from "next/link";
import type { ReactNode } from "react";
import { PERSONAS } from "@/platform/auth/personas";
import { getCurrentActor } from "@/platform/auth/session";
import { can } from "@/platform/authz/policy";
import { getRegisteredTools } from "@/platform/registry/registry";
import { PersonaSwitcher } from "@/platform/ui/PersonaSwitcher";
import { SidebarNav } from "@/platform/ui/SidebarNav";

/**
 * Chrome shared by every tool. Navigation is derived from the tool registry
 * and filtered by the policy engine, so a tool a persona cannot access is not
 * advertised to them.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const actor = getCurrentActor();
  const tools = getRegisteredTools().filter((tool) => can(actor, tool.requiredPermission));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <Link href="/" className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-xs font-semibold text-white">
            IT
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">Internal Tools</span>
            <span className="block text-xs text-slate-500">Platform POC</span>
          </span>
        </Link>

        <div className="flex-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tools</p>
          <SidebarNav
            items={tools.map((tool) => ({
              id: tool.id,
              href: tool.href,
              title: tool.title,
              glyph: tool.glyph,
            }))}
          />
        </div>

        <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400">
          Synthetic data · mocked services
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <div className="leading-tight">
            <p className="text-sm font-medium text-slate-900">{actor.name}</p>
            <p className="text-xs text-slate-500">{actor.title}</p>
          </div>
          <PersonaSwitcher actor={actor} personas={PERSONAS} />
        </header>
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
