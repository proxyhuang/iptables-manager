import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  reconnectInterval?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { onMessage, onError, onClose, reconnectInterval = 3000 } = options;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`WebSocket connected: ${url}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        onClose?.();

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [url, onMessage, onError, onClose, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return wsRef.current;
};
