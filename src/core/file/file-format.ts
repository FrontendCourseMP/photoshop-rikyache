import type { ImageFormat } from '../types/image-document';

export type SupportedImageFormat = ImageFormat | 'unknown';

const PNG_EXTENSIONS = new Set(['png']);
const JPG_EXTENSIONS = new Set(['jpg', 'jpeg']);
const GB7_EXTENSIONS = new Set(['gb7']);

export function getFileExtension(fileName: string): string {
  const normalizedName = fileName.trim().toLowerCase();
  const lastDotIndex = normalizedName.lastIndexOf('.');

  if (lastDotIndex === -1 || lastDotIndex === normalizedName.length - 1) {
    return '';
  }

  return normalizedName.slice(lastDotIndex + 1);
}

export function detectSupportedImageFormat(
  fileName: string,
): SupportedImageFormat {
  const extension = getFileExtension(fileName);

  if (PNG_EXTENSIONS.has(extension)) {
    return 'png';
  }

  if (JPG_EXTENSIONS.has(extension)) {
    return 'jpg';
  }

  if (GB7_EXTENSIONS.has(extension)) {
    return 'gb7';
  }

  return 'unknown';
}

export function isBrowserDecodableFormat(
  format: SupportedImageFormat,
): format is Extract<ImageFormat, 'png' | 'jpg'> {
  return format === 'png' || format === 'jpg';
}
