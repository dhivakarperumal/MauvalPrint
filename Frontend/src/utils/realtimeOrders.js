const getOrderId = (order) => order?.order_id || order?.orderID;

export const applyOrderRealtimeEvent = (orders, event) => {
  const id = event?.id || getOrderId(event?.data);
  if (!id) return orders;

  if (event.action === "deleted") {
    return orders.filter((order) => String(getOrderId(order)) !== String(id));
  }

  const incoming = event.data || {};
  const normalized = {
    ...incoming,
    cart: incoming.cart || incoming.items || [],
    order_id: id,
    orderID: id,
    paymentID: incoming.payment_id || incoming.paymentID,
    createdAt: incoming.createdAt || {
      toDate: () => new Date(incoming.created_at || Date.now()),
    },
  };
  const index = orders.findIndex((order) => String(getOrderId(order)) === String(id));

  if (index === -1) return [normalized, ...orders];
  return orders.map((order, orderIndex) =>
    orderIndex === index ? { ...order, ...normalized } : order
  );
};
