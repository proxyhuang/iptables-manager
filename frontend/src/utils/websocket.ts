// Get WebSocket URL based on environment
export const getWebSocketUrl = (path: string): string => {
  const token = localStorage.getItem('token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

  if (process.env.NODE_ENV === 'production') {
    // In production (Docker), use current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}${tokenParam}`;
  } else {
    // In development, use localhost:8080
    return `ws://localhost:8080${path}${tokenParam}`;
  }
};
