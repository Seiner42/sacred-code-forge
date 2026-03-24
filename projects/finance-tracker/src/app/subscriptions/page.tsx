export const dynamic = "force-dynamic";

import { SubscriptionsClient } from "@/components/subscriptions-client";
import { getSubscriptions } from "@/lib/finance-data";

export default function SubscriptionsPage() {
  const subscriptions = getSubscriptions();

  return <SubscriptionsClient initialSubscriptions={subscriptions} />;
}
