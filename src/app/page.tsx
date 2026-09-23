import Link from "next/link";
import { getCurrentActor } from "@/platform/auth/session";
import { can, permissionsFor } from "@/platform/authz/policy";
import { getRegisteredTools } from "@/platform/registry/registry";
import { PageHeader } from "@/platform/ui/PageHeader";

export default function HomePage() {
  const actor = getCurrentActor();
  const tools = getRegisteredTools();
  const permissions = permissionsFor(actor);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Internal tools"
        description={`Tools available to ${actor.name} (${actor.role}). Switch persona in the header to see role restrictions.`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const allowed = can(actor, tool.requiredPermission);
          return (
            <div
              key={tool.id}
              className={`rounded-lg border p-4 shadow-sm transition-colors ${
                allowed ? "border-slate-200 bg-white hover:border-slate-300" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="text-lg leading-none">
                  {tool.glyph}
                </span>
                {allowed ? (
                  <Link
                    href={tool.href}
                    className="text-sm font-semibold text-slate-900 underline-offset-4 hover:text-blue-700 hover:underline"
                  >
                    {tool.title}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">{tool.title}</span>
                )}
                {allowed ? null : (
                  <span className="ml-auto rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-500">
                    No access
                  </span>
                )}
              </div>
              <p className={`mt-2 text-sm ${allowed ? "text-slate-600" : "text-slate-400"}`}>
                {tool.description}
              </p>
              <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                requires <code className="font-mono text-slate-600">{tool.requiredPermission}</code>
              </p>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h2 className="panel-heading">Effective permissions</h2>
        <div className="p-4">
          <p className="text-xs text-slate-500">
            Composed from the platform policy plus every registered tool&apos;s policy module.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <li
                key={permission}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700"
              >
                {permission}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
