export const dynamic = "force-dynamic";

import { CategoriesAdminClient } from "@/components/categories-admin-client";
import { getAllCategories, getAllMerchantRules } from "@/lib/finance-data";

export default function AdminPage() {
  const categories = getAllCategories();
  const merchantRules = getAllMerchantRules();
  return <CategoriesAdminClient initialCategories={categories} initialMerchantRules={merchantRules} />;
}
