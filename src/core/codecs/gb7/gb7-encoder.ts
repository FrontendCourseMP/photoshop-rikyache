import {
  GB7_HEADER_SIZE,
  GB7_MASK_FLAG,
  GB7_MAX_CHANNEL_VALUE,
  GB7_MAX_GRAY_VALUE,
  GB7_PIXEL_GRAY_MASK,
  GB7_PIXEL_MASK_BIT,
  GB7_SIGNATURE,
  GB7_VERSION,
} from './gb7-constants';
import type { ImageDocument } from '../../types/image-document';

export async function encodeGb7ImageDocument(
  imageDocument: ImageDocument,
): Promise<Blob> {
  validateImageDocumentSize(imageDocument);

  const hasMask = detectMaskUsage(imageDocument);
  const pixelCount = imageDocument.width * imageDocument.height;
  const totalSize = GB7_HEADER_SIZE + pixelCount;

  const buffer = new ArrayBuffer(totalSize);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  writeSignature(bytes);
  writeHeader(view, imageDocument.width, imageDocument.height, hasMask);
  writePixels(bytes, imageDocument, hasMask);

  return new Blob([buffer], { type: 'application/octet-stream' });
}

function validateImageDocumentSize(imageDocument: ImageDocument): void {
  if (imageDocument.width <= 0 || imageDocument.height <= 0) {
    throw new Error('Нельзя сохранить GB7 для изображения с нулевым размером.');
  }

  if (imageDocument.width > 0xffff || imageDocument.height > 0xffff) {
    throw new Error(
      'Размер изображения превышает ограничения формата GB7 (максимум 65535x65535).',
    );
  }
}

function detectMaskUsage(imageDocument: ImageDocument): boolean {
  for (let index = 3; index < imageDocument.pixels.length; index += 4) {
    if (imageDocument.pixels[index] < 128) {
      return true;
    }
  }

  return false;
}

function writeSignature(bytes: Uint8Array): void {
  for (let index = 0; index < GB7_SIGNATURE.length; index += 1) {
    bytes[index] = GB7_SIGNATURE[index];
  }
}

function writeHeader(
  view: DataView,
  width: number,
  height: number,
  hasMask: boolean,
): void {
  view.setUint8(4, GB7_VERSION);
  view.setUint8(5, hasMask ? GB7_MASK_FLAG : 0);
  view.setUint16(6, width, false);
  view.setUint16(8, height, false);
  view.setUint16(10, 0, false);
}

function writePixels(
  bytes: Uint8Array,
  imageDocument: ImageDocument,
  hasMask: boolean,
): void {
  const pixels = imageDocument.pixels;
  const pixelCount = imageDocument.width * imageDocument.height;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const rgbaIndex = pixelIndex * 4;

    const red = pixels[rgbaIndex];
    const green = pixels[rgbaIndex + 1];
    const blue = pixels[rgbaIndex + 2];
    const alpha = pixels[rgbaIndex + 3];

    const gray8 = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    const gray7 = clampToGray7(Math.round((gray8 / GB7_MAX_CHANNEL_VALUE) * GB7_MAX_GRAY_VALUE));

    const maskBit = hasMask ? (alpha >= 128 ? GB7_PIXEL_MASK_BIT : 0) : 0;
    const encodedPixel = maskBit | (gray7 & GB7_PIXEL_GRAY_MASK);

    bytes[GB7_HEADER_SIZE + pixelIndex] = encodedPixel;
  }
}

function clampToGray7(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > GB7_MAX_GRAY_VALUE) {
    return GB7_MAX_GRAY_VALUE;
  }

  return value;
}