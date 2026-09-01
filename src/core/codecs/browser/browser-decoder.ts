import { detectSupportedImageFormat } from '../../file/file-format';
import type { ImageDocument } from '../../types/image-document';

type BrowserImageAsset = ImageBitmap | HTMLImageElement;

export async function decodeBrowserImageFile(
  file: File,
): Promise<ImageDocument> {
  const sourceFormat = detectSupportedImageFormat(file.name);

  if (sourceFormat !== 'png' && sourceFormat !== 'jpg') {
    throw new Error('Формат не поддерживается браузерным декодером.');
  }

  const metadata = await readImageMetadata(file, sourceFormat);
  const imageAsset = await loadImageAsset(file);

  try {
    const width = imageAsset.width;
    const height = imageAsset.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      throw new Error('Не удалось получить 2D-контекст для декодирования.');
    }

    context.drawImage(imageAsset, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    return {
      name: file.name,
      width,
      height,
      colorDepth: metadata.colorDepth,
      sourceFormat,
      colorModel: metadata.colorModel,
      hasMask: false,
      hasAlpha: metadata.hasAlpha,
      pixels: new Uint8ClampedArray(imageData.data),
    };
  } finally {
    if (isImageBitmap(imageAsset)) {
      imageAsset.close();
    }
  }
}

interface BrowserImageMetadata {
  colorModel: ImageDocument['colorModel'];
  hasAlpha: boolean;
  colorDepth: number;
}

async function readImageMetadata(
  file: File,
  sourceFormat: 'png' | 'jpg',
): Promise<BrowserImageMetadata> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  return sourceFormat === 'png'
    ? readPngMetadata(bytes)
    : readJpegMetadata(bytes);
}

function readPngMetadata(bytes: Uint8Array): BrowserImageMetadata {
  if (bytes.length < 29 || readChunkType(bytes, 12) !== 'IHDR') {
    throw new Error('Некорректный PNG-файл.');
  }

  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const colorModel = colorType === 0 || colorType === 4 ? 'grayscale' : 'rgb';
  const hasAlpha = colorType === 4 || colorType === 6 || hasPngTransparencyChunk(bytes);
  const colorChannelCount = colorModel === 'grayscale' ? 1 : 3;

  return {
    colorModel,
    hasAlpha,
    colorDepth: bitDepth * (colorChannelCount + (hasAlpha ? 1 : 0)),
  };
}

function hasPngTransparencyChunk(bytes: Uint8Array): boolean {
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
    const chunkLength = view.getUint32(0, false);
    const chunkType = readChunkType(bytes, offset + 4);

    if (chunkType === 'tRNS') {
      return true;
    }

    offset += 12 + chunkLength;
  }

  return false;
}

function readChunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
}

function readJpegMetadata(bytes: Uint8Array): BrowserImageMetadata {
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];
    offset += 1;

    if (isStartOfFrameMarker(marker)) {
      const precision = bytes[offset + 2];
      const componentCount = bytes[offset + 7];

      return {
        colorModel: componentCount === 1 ? 'grayscale' : 'rgb',
        hasAlpha: false,
        colorDepth: precision * componentCount,
      };
    }

    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];

    if (segmentLength < 2) {
      break;
    }

    offset += segmentLength;
  }

  return { colorModel: 'rgb', hasAlpha: false, colorDepth: 24 };
}

function isStartOfFrameMarker(marker: number): boolean {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  );
}

async function loadImageAsset(file: File): Promise<BrowserImageAsset> {
  if (typeof window.createImageBitmap === 'function') {
    try {
      return await window.createImageBitmap(file);
    } catch {
      return await loadHtmlImageAsset(file);
    }
  }

  return await loadHtmlImageAsset(file);
}

function loadHtmlImageAsset(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.decoding = 'async';

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Браузер не смог декодировать изображение.'));
    };

    image.src = objectUrl;
  });
}

function isImageBitmap(
  imageAsset: BrowserImageAsset,
): imageAsset is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && imageAsset instanceof ImageBitmap;
}
