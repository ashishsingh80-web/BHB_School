import { navSections } from "@/config/navigation";

function humanizeSegment(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function titleForPath(pathname: string): string {
  for (const section of navSections) {
    const hit = section.items.find((i) => i.href === pathname);
    if (hit) return hit.title;
  }
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last) return humanizeSegment(last);
  return "BHB International School ERP";
}
