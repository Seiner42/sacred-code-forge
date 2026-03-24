export const dynamic = "force-dynamic";

import { OperationsClient } from "@/components/operations-client";
import { getCategories, getOperations } from "@/lib/finance-data";

export default function OperationsPage() {
  const transactions = getOperations();
  const categories = getCategories();

  return <OperationsClient transactions={transactions} categories={categories} />;
}
