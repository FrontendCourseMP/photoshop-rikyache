import { CANVAS_RENDERING } from './constants';
import type { ImageDocument } from '../types/image-document';
import type { AppChannels } from '../../app/app-state';
import { resizeImageDocument } from '../interpolation/resize-image';
import {
  DEFAULT_INTERPOLATION_METHOD,
  type InterpolationMethod,
} from '../interpolation/interpolation-types';

export interface CanvasRenderer {
  resize(width: number, height: number): void;
  setDocument(imageDocument: ImageDocument | null): void;
  setChannels(channels: AppChannels): void;
  setInterpolationMethod(method: InterpolationMethod): void;
  setViewScalePercent(scalePercent: number): void;
  getFitScalePercent(imageDocument: ImageDocument, padding: number): number;
  getPixelAt(x: number, y: number): { r: number; g: number; b: number; a: number } | null;
  getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } | null;
}

export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
): CanvasRenderer {
  const contextCandidate = canvas.getContext('2d');

  if (contextCandidate === null) {
    throw new Error('Не удалось получить 2D-контекст canvas.');
  }

  const context: CanvasRenderingContext2D = contextCandidate;

  let viewportWidth: number = CANVAS_RENDERING.fallbackViewportWidth;
  let viewportHeight: number = CANVAS_RENDERING.fallbackViewportHeight;
  let devicePixelRatioValue: number = Math.max(1, window.devicePixelRatio || 1);

  let currentDocument: ImageDocument | null = null;
  let currentChannels: AppChannels = { r: true, g: true, b: true, a: true };
  let interpolationMethod: InterpolationMethod = DEFAULT_INTERPOLATION_METHOD;
  let viewScalePercent = 100;
  let lastImageRect: { x: number; y: number; width: number; height: number } | null = null;

  function resize(width: number, height: number): void {
    viewportWidth = Math.max(1, Math.floor(width));
    viewportHeight = Math.max(1, Math.floor(height));
    devicePixelRatioValue = Math.max(1, window.devicePixelRatio || 1);

    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    canvas.width = Math.max(1, Math.floor(viewportWidth * devicePixelRatioValue));
    canvas.height = Math.max(
      1,
      Math.floor(viewportHeight * devicePixelRatioValue),
    );

    render();
  }

  function setDocument(imageDocument: ImageDocument | null): void {
    currentDocument = imageDocument;
    render();
  }

  function setChannels(channels: AppChannels): void {
    currentChannels = { ...channels };
    render();
  }

  function setInterpolationMethod(method: InterpolationMethod): void {
    interpolationMethod = method;
    render();
  }

  function setViewScalePercent(scalePercent: number): void {
    viewScalePercent = clamp(scalePercent, 12, 300);
    render();
  }

  function getFitScalePercent(imageDocument: ImageDocument, padding: number): number {
    const availableWidth = Math.max(1, viewportWidth - padding * 2);
    const availableHeight = Math.max(1, viewportHeight - padding * 2);
    const fitScale = Math.min(
      availableWidth / imageDocument.width,
      availableHeight / imageDocument.height,
    );

    return clamp(Math.floor(fitScale * 100), 12, 300);
  }

  function getPixelAt(x: number, y: number): { r: number; g: number; b: number; a: number } | null {
    if (!currentDocument || x < 0 || y < 0 || x >= currentDocument.width || y >= currentDocument.height) {
      return null;
    }

    const index = (Math.floor(y) * currentDocument.width + Math.floor(x)) * 4;
    return {
      r: currentDocument.pixels[index],
      g: currentDocument.pixels[index + 1],
      b: currentDocument.pixels[index + 2],
      a: currentDocument.pixels[index + 3],
    };
  }

  function getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!currentDocument || lastImageRect === null) return null;

    const rect = canvas.getBoundingClientRect();
    const xInViewport = clientX - rect.left;
    const yInViewport = clientY - rect.top;

    const xInImage = ((xInViewport - lastImageRect.x) / lastImageRect.width) * currentDocument.width;
    const yInImage = ((yInViewport - lastImageRect.y) / lastImageRect.height) * currentDocument.height;

    if (xInImage < 0 || xInImage >= currentDocument.width || yInImage < 0 || yInImage >= currentDocument.height) {
      return null;
    }

    return { x: xInImage, y: yInImage };
  }

  function render(): void {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
    context.fillStyle = readCssVariable('--color-canvas-background', '#1d1d1d');
    context.fillRect(0, 0, viewportWidth, viewportHeight);

    lastImageRect = null;

    if (currentDocument === null) {
      drawEmptyState(context, viewportWidth, viewportHeight);
      return;
    }

    const imageRect = getScaledRect(
      currentDocument.width,
      currentDocument.height,
      viewportWidth,
      viewportHeight,
      viewScalePercent,
    );

    const displayDocument = resizeImageDocument(
      createDisplayDocument(currentDocument, currentChannels),
      imageRect.width,
      imageRect.height,
      interpolationMethod,
    );
    const displayCanvas = createSourceCanvas(displayDocument);

    context.imageSmoothingEnabled = false;
    context.drawImage(displayCanvas, imageRect.x, imageRect.y);
    lastImageRect = imageRect;
  }

  resize(viewportWidth, viewportHeight);

  return {
    resize,
    setDocument,
    setChannels,
    setInterpolationMethod,
    setViewScalePercent,
    getFitScalePercent,
    getPixelAt,
    getCanvasCoordinates,
  };
}

function createDisplayDocument(
  imageDocument: ImageDocument,
  channels: AppChannels,
): ImageDocument {
  return {
    ...imageDocument,
    pixels: createSourceImageData(imageDocument, channels).data,
  };
}

function createSourceImageData(imageDocument: ImageDocument, channels: AppChannels): ImageData {
  const pixelBuffer = new Uint8ClampedArray(imageDocument.pixels);

  if (!channels.r || !channels.g || !channels.b || !channels.a) {
    for (let i = 0; i < pixelBuffer.length; i += 4) {
      if (!channels.r) pixelBuffer[i] = 0;
      if (!channels.g) pixelBuffer[i + 1] = 0;
      if (!channels.b) pixelBuffer[i + 2] = 0;
      if (!channels.a) pixelBuffer[i + 3] = 255; // If only alpha is selected, we might want to see it as a mask, but here we just toggle visibility
    }

    // Special case: if only Alpha is selected, show it as a grayscale mask
    if (!channels.r && !channels.g && !channels.b && channels.a) {
      for (let i = 0; i < pixelBuffer.length; i += 4) {
        const alpha = imageDocument.pixels[i + 3];
        pixelBuffer[i] = alpha;
        pixelBuffer[i + 1] = alpha;
        pixelBuffer[i + 2] = alpha;
        pixelBuffer[i + 3] = 255;
      }
    }
  }

  return new ImageData(
    pixelBuffer,
    imageDocument.width,
    imageDocument.height,
  );
}

function createSourceCanvas(imageDocument: ImageDocument): HTMLCanvasElement {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageDocument.width;
  sourceCanvas.height = imageDocument.height;

  const sourceContextCandidate = sourceCanvas.getContext('2d');

  if (sourceContextCandidate === null) {
    throw new Error('Не удалось создать вспомогательный canvas.');
  }

  const sourceContext: CanvasRenderingContext2D = sourceContextCandidate;

  const imageData = createSourceImageData(imageDocument, { r: true, g: true, b: true, a: true });
  sourceContext.putImageData(imageData, 0, 0);

  return sourceCanvas;
}

function getScaledRect(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  scalePercent: number,
): { x: number; y: number; width: number; height: number } {
  const scale = scalePercent / 100;
  const drawWidth = Math.max(1, Math.round(imageWidth * scale));
  const drawHeight = Math.max(1, Math.round(imageHeight * scale));

  return {
    x: Math.floor((viewportWidth - drawWidth) / 2),
    y: Math.floor((viewportHeight - drawHeight) / 2),
    width: drawWidth,
    height: drawHeight,
  };
}

function drawEmptyState(
  context: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
): void {
  const primaryText = 'Перетащите PNG/JPG сюда';
  const secondaryText = 'или нажмите «Загрузить»';

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillStyle = 'rgba(255, 255, 255, 0.18)';
  context.font = '500 24px Arial, Helvetica, sans-serif';
  context.fillText(primaryText, viewportWidth / 2, viewportHeight / 2 - 14);

  context.fillStyle = 'rgba(255, 255, 255, 0.12)';
  context.font = '400 18px Arial, Helvetica, sans-serif';
  context.fillText(
    secondaryText,
    viewportWidth / 2,
    viewportHeight / 2 + CANVAS_RENDERING.placeholderLineGap,
  );
}

function readCssVariable(variableName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

  return value || fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
