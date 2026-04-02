import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  title: string;
  description?: string;
};

export function ModulePlaceholder({ title, description }: Props) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          {description ??
            "Scaffolded per the BHB International School ERP blueprint. Domain logic, validations, and integrations will land in phased sprints."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        <p>
          Prisma now includes foundations for the full blueprint: enquiry follow-ups,
          document checklists, admission fees, surveys (GPS), online leads (UTM),
          expenses, staff advances, vehicles & compliance, fuel, inventory, and smart
          content assets. UI and workflows for this screen are queued next.
        </p>
      </CardContent>
    </Card>
  );
}
