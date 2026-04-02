import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { createFeeHead } from "@/app/(erp)/actions/master";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function FeeHeadsPage() {
  const session = await getCurrentSession();
  const heads = session
    ? await prisma.feeHead.findMany({
        where: { sessionId: session.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Add fee head</CardTitle>
          <CardDescription>
            Tuition, transport, development — used in fee structure and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <form action={createFeeHead} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Head name</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit" className="w-fit">
                Add fee head
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">Create a session first.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee heads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heads.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.sortOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
