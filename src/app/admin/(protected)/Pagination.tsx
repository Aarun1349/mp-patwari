import Link from "next/link";

/** Server-side pagination control. Builds ?page= links preserving other query
 * params (search, filters). Used across Users / Attempts / Orders. */
export function Pagination({
  basePath,
  query,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  query: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  return (
    <div className="admin-pagination">
      <span className="pg-info">
        {from}–{to} of {total.toLocaleString("en-IN")}
      </span>
      <div className="pg-controls">
        <Link
          className={`btn btn-secondary btn-sm${current <= 1 ? " pg-disabled" : ""}`}
          href={href(current - 1)}
          aria-disabled={current <= 1}
        >
          ← Prev
        </Link>
        <span className="pg-page">
          Page {current} of {totalPages}
        </span>
        <Link
          className={`btn btn-secondary btn-sm${current >= totalPages ? " pg-disabled" : ""}`}
          href={href(current + 1)}
          aria-disabled={current >= totalPages}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
