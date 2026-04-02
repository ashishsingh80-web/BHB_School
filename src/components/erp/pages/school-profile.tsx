import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { updateSchoolProfile } from "@/app/(erp)/actions/master";

export async function SchoolProfilePage() {
  const profile = await prisma.schoolProfile.findFirst();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>School profile</CardTitle>
        <CardDescription>
          Core identity used across certificates, receipts, and communications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateSchoolProfile} className="grid gap-4">
          <input type="hidden" name="id" value={profile?.id ?? ""} />
          <div className="grid gap-2">
            <Label htmlFor="name">School name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={profile?.name ?? "BHB International School"}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="board">Board</Label>
            <Input id="board" name="board" defaultValue={profile?.board ?? "CBSE"} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={profile?.tagline ?? ""} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="established">Established (year)</Label>
              <Input
                id="established"
                name="established"
                type="number"
                defaultValue={profile?.established ?? 2023}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={profile?.email ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" defaultValue={profile?.website ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              defaultValue={profile?.addressLine1 ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={profile?.addressLine2 ?? ""}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={profile?.city ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={profile?.state ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pincode">PIN</Label>
              <Input id="pincode" name="pincode" defaultValue={profile?.pincode ?? ""} />
            </div>
          </div>
          <Button type="submit" className="w-fit">
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
