// Shared domain types
export type Currency = { code: string; name: string; symbol: string };
export type Service = { id: string; name: string };
export type ServiceCategory = { category: string; services: Service[] };

export type Subscription = {
  id: string;
  userId: string;
  serviceId: string;
  name?: string; // display name for custom services (not in the catalog)
  startDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  monthly?: boolean;
};
