import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import useRealtimeEvent from "./useRealtimeEvent";
import normalizeRealtimeProduct from "../utils/normalizeRealtimeProduct";

const getRecordId = (record) =>
  record?.id || record?.product_id || record?.productId || record?.category_id ||
  record?.review_id || record?.keyword_id || record?.video_id || record?.logo_id ||
  record?.logoId || record?.dealer_id || record?.invoice_id || record?.invoice_no ||
  record?.order_id || record?.orderID || record?.address_id;

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

      const incoming = resource === "products"
        ? normalizeRecord(normalizeRealtimeProduct(event.data || {}, id), id)
        : normalizeRecord(event.data || {}, id);
      const index = items.findIndex((item) => String(getRecordId(item)) === String(id));
      const next = index === -1
        ? [incoming, ...items]
        : items.map((item, itemIndex) => itemIndex === index ? { ...item, ...incoming } : item);
      return next.filter(matchesRecord).slice(0, limit);
    });
  };

  useRealtimeEvent(socket, "data:created", handleChange);
  useRealtimeEvent(socket, "data:updated", handleChange);
  useRealtimeEvent(socket, "data:deleted", handleChange);
}
