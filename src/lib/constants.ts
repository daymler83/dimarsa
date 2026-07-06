export const COMMISSION_PERCENTAGE = 0.1;

export const USER_ROLES = ["seller", "admin"] as const;
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export const COMMISSION_STATUSES = ["pending", "approved", "paid", "cancelled"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
