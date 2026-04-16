import { CANVAS_RENDERING } from './constants';
import type { ImageDocument } from '../types/image-document';

export interface CanvasRenderer {
  resize(width: number, height: number): void;
  setDocument(imageDocument: ImageDocument | null): void;
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
  let sourceCanvas: HTMLCanvasElement | null = null;

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
    sourceCanvas = imageDocument ? createSourceCanvas(imageDocument) : null;
    render();
  }

  function render(): void {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
    context.fillStyle = readCssVariable('--color-canvas-background', '#1d1d1d');
    context.fillRect(0, 0, viewportWidth, viewportHeight);

    if (currentDocument === null || sourceCanvas === null) {
      drawEmptyState(context, viewportWidth, viewportHeight);
      return;
    }

    const fitRect = getFitRect(
      currentDocument.width,
      currentDocument.height,
      viewportWidth,
      viewportHeight,
      CANVAS_RENDERING.imagePadding,
    );

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.drawImage(
      sourceCanvas,
      fitRect.x,
      fitRect.y,
      fitRect.width,
      fitRect.height,
    );
  }

  resize(viewportWidth, viewportHeight);

  return {
    resize,
    setDocument,
  };
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

  const pixelBuffer = new Uint8ClampedArray(imageDocument.pixels);

  const imageData = new ImageData(
    pixelBuffer,
    imageDocument.width,
    imageDocument.height,
  );

  sourceContext.putImageData(imageData, 0, 0);

  return sourceCanvas;
}

function getFitRect(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
): { x: number; y: number; width: number; height: number } {
  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);

  const scale = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight,
  );

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