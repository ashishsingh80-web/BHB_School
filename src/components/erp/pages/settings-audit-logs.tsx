import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export async function SettingsAuditLogsPage() {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
          <CardDescription>
            Recent security and data events (who did what). More actions will appear here as
            server mutations are instrumented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No audit entries yet. Create an enquiry, record a fee payment, add staff, or post an
              expense to generate events.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Id</TableHead>
                    <TableHead>Meta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {r.createdAt.toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[140px] text-xs">
                        {r.user?.name ?? "—"}
                        {r.user?.email ? (
                          <span className="text-muted-foreground block truncate">
                            {r.user.email}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.action}</TableCell>
                      <TableCell className="text-sm">{r.entity}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.entityId ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate font-mono text-xs">
                        {r.meta == null
                          ? "—"
                          : JSON.stringify(r.meta).slice(0, 120)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
