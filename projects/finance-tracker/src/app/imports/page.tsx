export const dynamic = "force-dynamic";

import { ImportsClient } from "@/components/imports-client";
import { getImports } from "@/lib/finance-data";

export default function ImportsPage() {
  const items = getImports();

  return <ImportsClient initialImports={items} />;
}
