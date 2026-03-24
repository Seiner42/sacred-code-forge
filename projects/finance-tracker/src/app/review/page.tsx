export const dynamic = "force-dynamic";

import { ReviewClient } from "@/components/review-client";
import { getCategories, getPendingReviewItems } from "@/lib/finance-data";

export default function ReviewPage() {
  const items = getPendingReviewItems();
  const categories = getCategories();

  return <ReviewClient initialItems={items} categories={categories} />;
}
