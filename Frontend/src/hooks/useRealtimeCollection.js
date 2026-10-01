import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import useRealtimeEvent from "./useRealtimeEvent";
import normalizeRealtimeProduct from "../utils/normalizeRealtimeProduct";

const getRecordId = (record) =>
  record?.id || record?.product_id || record?.productId || record?.category_id ||
  record?.review_id || record?.keyword_id || record?.video_id || record?.logo_id ||
  record?.logoId || record?.dealer_id || record?.invoice_id || record?.invoice_no ||
  record?.order_id || record?.orderID || record?.address_id || record?.user_id;

export default function useRealtimeCollection(
  resource,
  setItems,
  matchesRecord = () => true,
  limit = Infinity,
  normalizeRecord = (record, id) => ({ ...(record || {}), id })
) {
  const { socket } = useContext(AuthContext);

  const handleChange = (event) => {
    if (event.resource !== resource) return;
    const id = event.id || getRecordId(event.data);
    if (!id) return;

    setItems((items) => {
      if (event.action === "deleted") {
        if (event.data?.clearAll) return [];
        return items.filter((item) => String(getRecordId(item)) !== String(id));
      }

      const existingIndex = items.findIndex((item) => String(getRecordId(item)) === String(id));
      const existing = existingIndex === -1 ? {} : items[existingIndex];
      const rawData = resource === "products"
        ? { ...existing, ...(event.data || {}) }
        : event.data || {};
      const incoming = resource === "products"
        ? normalizeRecord(normalizeRealtimeProduct(rawData, id), id, existing)
        : normalizeRecord(rawData, id, existing);
      const next = existingIndex === -1
        ? [incoming, ...items]
        : items.map((item, index) => index === existingIndex ? { ...item, ...incoming, id } : item);
      return next.filter(matchesRecord).slice(0, limit);
    });
  };

  useRealtimeEvent(socket, "data:created", handleChange);
  useRealtimeEvent(socket, "data:updated", handleChange);
  useRealtimeEvent(socket, "data:deleted", handleChange);
}
