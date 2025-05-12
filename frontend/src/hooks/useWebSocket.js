import { useEffect, useRef } from "react";
import { WebSocketService } from "../services";

/**
 * Custom hook to manage WebSocket connection and handlers
 * This hook takes care of properly managing dependencies and event registrations
 */
const useWebSocket = (
  chatId,
  onMessage,
  onTyping,
  onRead,
  onEdited,
  onDeleted,
  setWebSocket,
  setError
) => {
  // Use a ref to track current callback functions (prevents unnecessary reconnections)
  const callbacksRef = useRef({
    onMessage,
    onTyping,
    onRead,
    onEdited,
    onDeleted,
  });

  // Update ref when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onTyping,
      onRead,
      onEdited,
      onDeleted,
    };
  }, [onMessage, onTyping, onRead, onEdited, onDeleted]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!chatId) return;

    console.log("===== DEBUG: Setting up WebSocket for chat ID:", chatId);
    const ws = new WebSocketService();

    // Register handlers before connecting
    ws.on("message", (data) => {
      console.log("WebSocket 'message' event received:", data);
      callbacksRef.current.onMessage(data);
    })
      .on("typing", (data) => {
        console.log("WebSocket 'typing' event received:", data);
        callbacksRef.current.onTyping(data);
      })
      .on("read", (data) => {
        console.log("WebSocket 'read' event received:", data);
        callbacksRef.current.onRead(data);
      })
      .on("edited", (data) => {
        console.log("WebSocket 'edited' event received:", data);
        callbacksRef.current.onEdited(data);
      })
      .on("deleted", (data) => {
        console.log("WebSocket 'deleted' event received:", data);
        callbacksRef.current.onDeleted(data);
      })
      .on("open", (event) => {
        console.log("===== DEBUG: WebSocket frontend connected =====");
        console.log("WebSocket connected for chat:", chatId);
      })
      .on("close", (event) => {
        console.log("WebSocket 'close' event received:", event);
        console.log("WebSocket closed for chat:", chatId, "Code:", event.code);
      });

    // Now connect with error handling
    ws.connect(chatId)
      .then((connectedWs) => {
        console.log("WebSocket fully connected and ready to use");
        setWebSocket(connectedWs);
      })
      .catch((error) => {
        console.error(
          "===== DEBUG: ERROR - WebSocket connection failed =====",
          error
        );
        setError(
          "Failed to establish real-time connection. Please refresh the page."
        );
      });

    // Cleanup WebSocket on unmount or when chat changes
    return () => {
      console.log("Cleaning up WebSocket connection for chat:", chatId);
      if (ws) {
        ws.disconnect();
      }
    };
  }, [chatId, setWebSocket, setError]);
};

export default useWebSocket;
