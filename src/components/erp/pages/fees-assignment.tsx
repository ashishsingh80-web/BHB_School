import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function FeesAssignmentPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Fee assignment</CardTitle>
        <CardDescription>
          Per-student fee plans and concessions will live here. For now, class-wise
          amounts are maintained under <strong>Fee structure</strong>; payments are
          recorded under <strong>Collect fee</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/fees/structure" className={cn(buttonVariants())}>
          Open fee structure
        </Link>
      </CardContent>
    </Card>
  );
}
