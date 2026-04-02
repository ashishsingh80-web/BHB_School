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

export function AccessDenied({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description ??
            "Your current ERP role does not have access to this area. If this looks incorrect, ask the administrator to review your role and permissions."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to dashboard
        </Link>
        <Link href="/portal/student" className={cn(buttonVariants({ variant: "outline" }))}>
          Student portal
        </Link>
      </CardContent>
    </Card>
  );
}
