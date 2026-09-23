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
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="field-label">Search</span>
        <input
          type="search"
          value={query}
          placeholder={searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setParam("q", event.target.value);
          }}
          className="field w-72"
        />
      </label>
      {filters.map((filter) => (
        <label key={filter.name} className="flex flex-col gap-1">
          <span className="field-label">{filter.label}</span>
          <select
            value={searchParams.get(filter.name) ?? ""}
            onChange={(event) => setParam(filter.name, event.target.value)}
            className="field w-44 capitalize"
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
