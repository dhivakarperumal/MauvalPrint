const getOrderId = (order) => order?.order_id || order?.orderID;

export const applyOrderRealtimeEvent = (orders, event) => {
  const id = event?.id || getOrderId(event?.data);
  if (!id) return orders;
  if (event.action === "deleted") {
    return orders.filter((order) => String(getOrderId(order)) !== String(id));
  }

  const data = event.data || {};
  const order = {
    ...data,
    order_id: id,
    orderID: id,
    paymentID: data.payment_id || data.paymentID,
    cart: data.cart || data.items || [],
    createdAt: data.createdAt || { toDate: () => new Date(data.created_at || Date.now()) },
  };
  const index = orders.findIndex((item) => String(getOrderId(item)) === String(id));
  if (index === -1) return [order, ...orders];
  return orders.map((item, itemIndex) => itemIndex === index ? { ...item, ...order } : item);
};