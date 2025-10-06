export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type Subscription = {
  id: string;
  userId: string; // "default" now, real userId later
  serviceId: string;
  startDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
};

export type Service = {
  id: string;
  name: string;
};
