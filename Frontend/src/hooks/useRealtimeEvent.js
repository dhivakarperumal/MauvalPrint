import { useEffect, useRef } from "react";

export default function useRealtimeEvent(socket, eventName, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return undefined;

    const listener = (payload) => handlerRef.current(payload);
    socket.on(eventName, listener);
    return () => socket.off(eventName, listener);
  }, [socket, eventName]);
}
