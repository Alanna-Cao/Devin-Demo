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
        title="Internal tools"
        description={`Tools available to ${actor.name} (${actor.role}). Switch persona in the header to see role restrictions.`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const allowed = can(actor, tool.requiredPermission);
          return (
            <div
              key={tool.id}
              className={`rounded-lg border p-4 ${allowed ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100 opacity-60"}`}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden>{tool.glyph}</span>
                {allowed ? (
                  <Link href={tool.href} className="font-medium text-blue-700 hover:underline">
                    {tool.title}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-600">{tool.title}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                requires <code>{tool.requiredPermission}</code>
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Effective permissions</h2>
        <p className="mt-1 text-xs text-slate-500">
          Composed from the platform policy plus every registered tool&apos;s policy module.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <li key={permission} className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
              {permission}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
