import Link from "next/link";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

/**
 * The workhorse most internal tools need: a typed table with an empty state.
 * Searching and filtering live in URL query params and are applied server-side
 * by the tool (see `FilterBar`), so results always respect authorization.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyMessage = "Nothing to show.",
}: {
  rows: T[];
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
        <p className="mt-1 text-xs text-slate-500">Adjust the filters above to widen the search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm tabular-nums">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-slate-50">
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 align-middle text-slate-700 ${column.className ?? ""}`}
                >
                  {index === 0 && rowHref ? (
                    <Link
                      href={rowHref(row)}
                      className="font-medium text-slate-900 underline-offset-4 hover:text-blue-700 hover:underline"
                    >
                      {column.render(row)}
                    </Link>
                  ) : (
                    column.render(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
