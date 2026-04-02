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
import { getCurrentSession } from "@/lib/session-context";

export async function AdmissionsRejectedPage() {
  const session = await getCurrentSession();

  const rows = session
    ? await prisma.admission.findMany({
        where: { sessionId: session.id, status: "REJECTED" },
        orderBy: { updatedAt: "desc" },
        include: { enquiry: true },
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejected / cancelled</CardTitle>
        <CardDescription>Applications marked rejected from the review queue.</CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No academic session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No rejected applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.enquiry?.childName ?? a.draftFirstName ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.enquiry?.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {a.updatedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {a.remarks ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
