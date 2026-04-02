import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const links = [
  { href: "/transport/stops", label: "Stops", hint: "Master pickup/drop points for the session" },
  { href: "/transport/routes", label: "Routes", hint: "Ordered stops per bus route, default vehicle" },
  {
    href: "/transport/mapping",
    label: "Student mapping",
    hint: "Assign route and boarding stop per student",
  },
  { href: "/transport/vehicles", label: "Vehicles", hint: "Fleet register, block/unblock, documents" },
  {
    href: "/transport/compliance",
    label: "Compliance & documents",
    hint: "Expiry tracking across vehicles",
  },
  { href: "/transport/fuel-log", label: "Fuel log", hint: "Issues and purchases (read-only view)" },
  { href: "/accounts/fuel", label: "Record fuel (Accounts)", hint: "Post purchases and issues" },
] as const;

export async function MasterTransportHubPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transport masters</CardTitle>
          <CardDescription>
            Operational screens under Transport: stops, routes, student mapping, vehicles,
            compliance, and fuel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.href} className="border-border rounded-lg border p-4">
                <Link href={l.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {l.label}
                </Link>
                <p className="text-muted-foreground mt-2 text-sm">{l.hint}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
