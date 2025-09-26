export function createApiUrl(path = '') {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').replace(/\/+$/, '');
  const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
  const normalizedPath = path.replace(/^\/+/, '');
  return `${baseUrl}/api/${apiVersion}${normalizedPath ? `/${normalizedPath}` : ''}`;
}
