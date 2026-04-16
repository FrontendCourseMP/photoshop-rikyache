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
    const hasAlpha = detectTransparency(imageData.data);

    return {
      name: file.name,
      width,
      height,
      colorDepth: sourceFormat === 'png' && hasAlpha ? 32 : 24,
      sourceFormat,
      hasMask: false,
      hasAlpha,
      pixels: new Uint8ClampedArray(imageData.data),
    };
  } finally {
    if (isImageBitmap(imageAsset)) {
      imageAsset.close();
    }
  }
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

function detectTransparency(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) {
      return true;
    }
  }

  return false;
}

function isImageBitmap(
  imageAsset: BrowserImageAsset,
): imageAsset is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && imageAsset instanceof ImageBitmap;
}
