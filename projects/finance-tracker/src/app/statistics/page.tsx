export const dynamic = "force-dynamic";

import { StatisticsClient } from "@/components/statistics-client";
import { getCategories, getOperations } from "@/lib/finance-data";

export default function StatisticsPage() {
  const transactions = getOperations();
  const categories = getCategories();

  return <StatisticsClient transactions={transactions} categories={categories} />;
}
