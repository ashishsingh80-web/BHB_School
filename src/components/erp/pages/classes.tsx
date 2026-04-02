import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { createClass } from "@/app/(erp)/actions/master";
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

export async function ClassesPage() {
  const session = await getCurrentSession();
  const classes = session
    ? await prisma.class.findMany({
        where: { sessionId: session.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Add class</CardTitle>
          <CardDescription>
            Nursery through Class X — names align with your master list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <form action={createClass} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Class name</Label>
                <Input id="name" name="name" placeholder="Class V" required />
              </div>
              <Button type="submit" className="w-fit">
                Add class
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              Create an academic session first under Master → Academic Sessions.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>
            {session ? `Session: ${session.name}` : "No session selected"}
          </CardDescription>
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
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.sortOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {session && classes.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              No classes yet. Seed sample data or add rows above.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
