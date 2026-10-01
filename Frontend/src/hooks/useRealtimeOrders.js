import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import useRealtimeEvent from "./useRealtimeEvent";
import { applyOrderRealtimeEvent } from "../utils/realtimeOrders";

export default function useRealtimeOrders(setOrders, matchesOrder = () => true) {
  const { socket } = useContext(AuthContext);

  useRealtimeEvent(socket, "order:updated", (event) => {
    if (event.resource !== "orders") return;
    setOrders((currentOrders) =>
      applyOrderRealtimeEvent(currentOrders, event).filter(matchesOrder)
    );
  });
}
