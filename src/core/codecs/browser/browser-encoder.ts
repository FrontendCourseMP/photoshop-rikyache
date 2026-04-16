import type { ImageDocument } from '../../types/image-document';

export type BrowserEncodableFormat = 'png' | 'jpg';

const DEFAULT_JPEG_QUALITY = 0.92;

export async function encodeBrowserImageDocument(
  imageDocument: ImageDocument,
  format: BrowserEncodableFormat,
): Promise<Blob> {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const sourceCanvas = createSourceCanvas(imageDocument);

  return await canvasToBlob(
    sourceCanvas,
    mimeType,
    format === 'jpg' ? DEFAULT_JPEG_QUALITY : undefined,
  );
}

function createSourceCanvas(imageDocument: ImageDocument): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageDocument.width;
  canvas.height = imageDocument.height;

  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('Не удалось создать canvas для кодирования изображения.');
  }

  const pixelBuffer = new Uint8ClampedArray(imageDocument.pixels);

  const imageData = new ImageData(
    pixelBuffer,
    imageDocument.width,
    imageDocument.height,
  );

  context.putImageData(imageData, 0, 0);

  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error('Браузер не смог сформировать файл изображения.'));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}