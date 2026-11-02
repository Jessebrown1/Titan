// Builds a resized URL for Unsplash-hosted demo images; other URLs pass through.
export function img(url, width = 1200) {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=78`;
  }
  return url;
}

export function srcSet(url, widths = [480, 800, 1200, 1600]) {
  if (!url || !url.includes('images.unsplash.com')) return undefined;
  return widths.map((w) => `${img(url, w)} ${w}w`).join(', ');
}

// Downscale an uploaded photo in the browser before sending it to storage.
export async function compressImage(file, maxSize = 2000, quality = 0.84) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}
