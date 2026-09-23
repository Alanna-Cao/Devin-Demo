"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Navigation rendered from the tool registry; highlights the active tool. */
export function SidebarNav({ items }: { items: { id: string; href: string; title: string; glyph: string }[] }) {
  const pathname = usePathname();

  if (items.length === 0) {
    return <p className="px-3 text-sm text-slate-500">No tools available for this role.</p>;
  }

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-slate-100 font-medium text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {item.glyph}
            </span>
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
