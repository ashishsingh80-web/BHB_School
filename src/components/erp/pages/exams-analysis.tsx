import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export async function ExamsAnalysisPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Result analysis</CardTitle>
          <CardDescription>
            Deeper analytics (class-wise comparisons, term trends, subject-wise histograms) can be
            layered on top of the data you already capture in exams. Use the links below for what is
            available today.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/exams/results"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
          >
            Subject averages (exam)
          </Link>
          <Link
            href="/exams/weak-students"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
          >
            Weak students (exam)
          </Link>
          <Link
            href="/exams/report-card"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
          >
            Individual report cards
          </Link>
          <Link
            href="/exams/marks-entry"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          >
            Marks entry
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
