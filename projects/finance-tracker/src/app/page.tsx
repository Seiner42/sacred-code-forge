export const dynamic = "force-dynamic";

import { Dashboard } from "@/components/dashboard";
import { getDashboardData } from "@/lib/finance-data";

export default function Home() {
  const data = getDashboardData();

  return <Dashboard data={data} />;
}
