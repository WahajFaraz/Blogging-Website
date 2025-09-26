export function createApiUrl(path = '') {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://blogging-website-lyart.vercel.app').replace(/\/+$/, '');
  const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
  const normalizedPath = path.replace(/^\/+/, '');
  return `${baseUrl}/api/${apiVersion}${normalizedPath ? `/${normalizedPath}` : ''}`;
}
