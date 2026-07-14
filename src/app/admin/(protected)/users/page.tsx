import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { GrantCreditsForm } from "./GrantCreditsForm";
import { Pagination } from "../Pagination";

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await verifyAdminSession();
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q
    ? {
        OR: [
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        credits: true,
        _count: { select: { attempts: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="auth-card auth-card-wide">
      <h1>Users</h1>
      <p className="page-subtitle">Accounts, credits and activity.</p>

      <div className="admin-toolbar">
        <form method="get" className="admin-search">
          <input type="text" name="q" placeholder="Search phone, email, or name" defaultValue={q ?? ""} />
          <button type="submit">Search</button>
          {q && (
            <a className="btn btn-secondary" href="/admin/users">
              Clear
            </a>
          )}
        </form>
        <span className="toolbar-note toolbar-spacer">
          {total.toLocaleString("en-IN")} user(s){q ? " matching" : ""}
        </span>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Phone</th>
            <th>Email</th>
            <th>Name</th>
            <th>Joined</th>
            <th>Attempts</th>
            <th>Orders</th>
            <th>Tests remaining</th>
            <th>Grant free tests</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.phone ?? "—"}</td>
              <td>{user.email ?? "—"}</td>
              <td>{user.name ?? "—"}</td>
              <td>{user.createdAt.toLocaleDateString()}</td>
              <td>{user._count.attempts}</td>
              <td>{user._count.orders}</td>
              <td>{user.credits.reduce((s, c) => s + c.testsRemaining, 0)}</td>
              <td>
                <GrantCreditsForm userId={user.id} />
              </td>
              <td>
                <Link href={`/admin/users/${user.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination basePath="/admin/users" query={{ q }} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
