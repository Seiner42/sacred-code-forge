export const dynamic = "force-dynamic";

import { CategoriesAdminClient } from "@/components/categories-admin-client";
import { getAllCategories } from "@/lib/finance-data";

export default function AdminPage() {
  const categories = getAllCategories();
  return <CategoriesAdminClient initialCategories={categories} />;
}
