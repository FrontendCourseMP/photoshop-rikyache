import {
  GB7_HEADER_SIZE,
  GB7_MASK_FLAG,
  GB7_MAX_CHANNEL_VALUE,
  GB7_MAX_GRAY_VALUE,
  GB7_PIXEL_GRAY_MASK,
  GB7_PIXEL_MASK_BIT,
  GB7_RESERVED_FLAGS_MASK,
  GB7_SIGNATURE,
  GB7_VERSION,
} from './gb7-constants';
import type { Gb7Header } from './gb7-types';
import type { ImageDocument } from '../../types/image-document';

export async function decodeGb7File(file: File): Promise<ImageDocument> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  validateMinimumFileSize(bytes);
  validateSignature(bytes);

  const header = readHeader(bytes);
  validateHeader(bytes, header);

  const pixels = decodePixels(bytes, header);

  return {
    name: file.name,
    width: header.width,
    height: header.height,
    colorDepth: 7,
    sourceFormat: 'gb7',
    hasMask: header.hasMask,
    hasAlpha: header.hasMask,
    pixels,
  };
}

function validateMinimumFileSize(bytes: Uint8Array): void {
  if (bytes.length < GB7_HEADER_SIZE) {
    throw new Error('Файл GB7 слишком короткий.');
  }
}

function validateSignature(bytes: Uint8Array): void {
  for (let index = 0; index < GB7_SIGNATURE.length; index += 1) {
    if (bytes[index] !== GB7_SIGNATURE[index]) {
      throw new Error('Некорректная сигнатура GB7-файла.');
    }
  }
}

function readHeader(bytes: Uint8Array): Gb7Header {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const version = view.getUint8(4);
  const flags = view.getUint8(5);
  const width = view.getUint16(6, false);
  const height = view.getUint16(8, false);

  return {
    version,
    hasMask: (flags & GB7_MASK_FLAG) !== 0,
    width,
    height,
  };
}

function validateHeader(bytes: Uint8Array, header: Gb7Header): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flags = view.getUint8(5);
  const reserved = view.getUint16(10, false);

  if (header.version !== GB7_VERSION) {
    throw new Error(`Неподдерживаемая версия GB7: ${header.version}.`);
  }

  if ((flags & GB7_RESERVED_FLAGS_MASK) !== 0) {
    throw new Error('GB7-файл содержит неподдерживаемые флаги.');
  }

  if (reserved !== 0) {
    throw new Error('Некорректное зарезервированное поле в GB7-заголовке.');
  }

  if (header.width === 0 || header.height === 0) {
    throw new Error('Ширина и высота GB7-изображения должны быть больше нуля.');
  }

  const expectedPixelBytes = header.width * header.height;
  const expectedFileSize = GB7_HEADER_SIZE + expectedPixelBytes;

  if (bytes.length !== expectedFileSize) {
    throw new Error(
      `Некорректный размер GB7-файла. Ожидалось ${expectedFileSize} байт, получено ${bytes.length}.`,
    );
  }
}

function decodePixels(bytes: Uint8Array, header: Gb7Header): Uint8ClampedArray {
  const pixelCount = header.width * header.height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const byte = bytes[GB7_HEADER_SIZE + pixelIndex];

    const gray7 = byte & GB7_PIXEL_GRAY_MASK;
    const gray8 = Math.round((gray7 / GB7_MAX_GRAY_VALUE) * GB7_MAX_CHANNEL_VALUE);

    const alpha = header.hasMask
      ? (byte & GB7_PIXEL_MASK_BIT) !== 0
        ? 255
        : 0
      : 255;

    const rgbaIndex = pixelIndex * 4;
    rgba[rgbaIndex] = gray8;
    rgba[rgbaIndex + 1] = gray8;
    rgba[rgbaIndex + 2] = gray8;
    rgba[rgbaIndex + 3] = alpha;
  }

  return rgba;
}