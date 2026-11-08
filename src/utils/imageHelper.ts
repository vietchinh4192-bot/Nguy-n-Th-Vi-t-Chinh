/**
 * Helper to safely resolve image URLs across local assets, public folder, and base64 data URLs
 */
export function resolveImageUrl(src?: string | null): string {
  if (!src) return '';
  const trimmed = src.trim();
  if (trimmed.startsWith('data:image')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/public/')) return trimmed.substring(7);
  if (trimmed.startsWith('public/')) return '/' + trimmed.substring(7);
  if (trimmed.startsWith('/')) return trimmed;
  return '/' + trimmed;
}
