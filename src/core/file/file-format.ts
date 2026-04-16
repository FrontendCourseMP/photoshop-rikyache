import type { ImageFormat } from '../types/image-document';

const JPG_EXTENSIONS = ['jpg', 'jpeg'] as const;
const PNG_EXTENSIONS = ['png'] as const;
const GB7_EXTENSIONS = ['gb7'] as const;

export type SupportedImageFormat = ImageFormat | 'unknown';

export function detectSupportedImageFormat(fileName: string): SupportedImageFormat {
  const extension = getFileExtension(fileName);

  if (PNG_EXTENSIONS.includes(extension as (typeof PNG_EXTENSIONS)[number])) {
    return 'png';
  }

  if (JPG_EXTENSIONS.includes(extension as (typeof JPG_EXTENSIONS)[number])) {
    return 'jpg';
  }

  if (GB7_EXTENSIONS.includes(extension as (typeof GB7_EXTENSIONS)[number])) {
    return 'gb7';
  }

  return 'unknown';
}

export function isBrowserDecodableFormat(format: SupportedImageFormat): boolean {
  return format === 'png' || format === 'jpg';
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return '';
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}