"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export interface SelectFilter {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Generic search + select filters for any list view. State lives in the URL so
 * the server component can apply filters (and authorization) before rendering.
 */
export function FilterBar({
  searchPlaceholder = "Search…",
  filters,
}: {
  searchPlaceholder?: string;
  filters: SelectFilter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(queryParam);

  // Keep the controls in step with the URL when it changes elsewhere
  // (navigating back to an unfiltered list, a shared link, browser history).
  useEffect(() => setQuery(queryParam), [queryParam]);

  const setParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(name, value);
      else params.delete(name);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-xs font-medium text-slate-500">
        Search
        <input
          type="search"
          value={query}
          placeholder={searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setParam("q", event.target.value);
          }}
          className="mt-1 w-64 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </label>
      {filters.map((filter) => (
        <label key={filter.name} className="flex flex-col text-xs font-medium text-slate-500">
          {filter.label}
          <select
            value={searchParams.get(filter.name) ?? ""}
            onChange={(event) => setParam(filter.name, event.target.value)}
            className="mt-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
