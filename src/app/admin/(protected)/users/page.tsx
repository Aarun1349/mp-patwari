import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GrantCreditsForm } from "./GrantCreditsForm";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      credit: true,
      _count: { select: { attempts: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Users</h1>
      <form method="get" className="auth-form" style={{ maxWidth: "320px" }}>
        <input type="text" name="q" placeholder="Search phone, email, or name" defaultValue={q ?? ""} />
        <button type="submit">Search</button>
      </form>

      <p className="muted">{users.length} user(s){q ? " matching search" : " (showing latest 200)"}</p>

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
              <td>{user.credit?.testsRemaining ?? 0}</td>
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
    </div>
  );
}
