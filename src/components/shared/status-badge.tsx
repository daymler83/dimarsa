import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CommissionStatus, OrderStatus } from "@/lib/constants";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-sky-100 text-sky-700",
  preparing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const COMMISSION_STATUS_STYLES: Record<CommissionStatus, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-sky-100 text-sky-700",
  paid: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("border-transparent font-medium", ORDER_STATUS_STYLES[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <Badge className={cn("border-transparent font-medium", COMMISSION_STATUS_STYLES[status])}>
      {COMMISSION_STATUS_LABELS[status]}
    </Badge>
  );
}
