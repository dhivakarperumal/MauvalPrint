const normalizeStatus = (status) =>
  String(status || "").trim().toLowerCase().replace(/[\s_-]+/g, " ");

export const isNewOrderStatus = (status) =>
  ["place order", "placed", "order placed"].includes(normalizeStatus(status));

export const getAvailableOrderStatuses = (currentStatus) => {
  const value = String(currentStatus || "").trim() || "Placed";
  const normalized = normalizeStatus(value);

  if (["place order", "placed", "order placed"].includes(normalized)) {
    return [
      { value, label: "Order Placed" },
      { value: "Packed", label: "Packed" },
      { value: "Shipped", label: "Shipped" },
      { value: "Delivered", label: "Delivered" },
      { value: "Cancelled", label: "Cancelled" },
    ];
  }
  if (normalized === "packed") {
    return [
      { value, label: "Packed" },
      { value: "Shipped", label: "Shipped" },
      { value: "Delivered", label: "Delivered" },
      { value: "Cancelled", label: "Cancelled" },
    ];
  }
  if (normalized === "shipped") {
    return [
      { value, label: "Shipped" },
      { value: "Delivered", label: "Delivered" },
      { value: "Cancelled", label: "Cancelled" },
    ];
  }
  if (normalized === "delivered" || normalized === "cancelled") {
    return [{ value, label: value }];
  }

  return [{ value, label: value }];
};

export const getOrderTrackingIndex = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized.includes("cancel")) return 4;
  if (normalized.includes("deliver")) return 3;
  if (normalized.includes("ship")) return 2;
  if (normalized.includes("pack")) return 1;
  return 0;
};
