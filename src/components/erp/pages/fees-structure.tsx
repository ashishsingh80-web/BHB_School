import { upsertFeeStructure } from "@/app/(erp)/actions/fees";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export async function FeesStructurePage() {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <p className="text-muted-foreground text-sm">
        Create an academic session and fee heads under Master Setup first.
      </p>
    );
  }

  const [classes, heads, structures] = await Promise.all([
    prisma.class.findMany({
      where: { sessionId: session.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.feeHead.findMany({
      where: { sessionId: session.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.feeStructure.findMany({
      where: { sessionId: session.id },
    }),
  ]);

  const amountByKey = new Map<string, string>();
  for (const s of structures) {
    amountByKey.set(`${s.classId}\t${s.headId}`, s.amount.toString());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee structure</CardTitle>
        <CardDescription>
          Class-wise amounts per fee head for session <strong>{session.name}</strong>. Enter
          rupees and save each cell.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {heads.length === 0 || classes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add classes and fee heads under Master Setup before defining structure.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[100px] bg-card">
                    Class
                  </TableHead>
                  {heads.map((h) => (
                    <TableHead key={h.id} className="min-w-[140px] whitespace-normal">
                      {h.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="bg-card sticky left-0 z-10 font-medium">
                      {c.name}
                    </TableCell>
                    {heads.map((h) => {
                      const key = `${c.id}\t${h.id}`;
                      const defaultVal = amountByKey.get(key) ?? "";
                      return (
                        <TableCell key={h.id} className="align-top">
                          <form action={upsertFeeStructure} className="flex flex-col gap-1">
                            <input type="hidden" name="classId" value={c.id} />
                            <input type="hidden" name="headId" value={h.id} />
                            <Input
                              name="amount"
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={defaultVal}
                              className="h-8 w-full min-w-[96px]"
                              placeholder="0"
                            />
                            <Button type="submit" size="sm" variant="secondary" className="h-7">
                              Save
                            </Button>
                          </form>
                        </TableCell>
                      );
                    })}
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
