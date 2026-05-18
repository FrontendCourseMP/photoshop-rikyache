import type { ImageDocument } from '../types/image-document';
import type { InterpolationMethod } from './interpolation-types';

const CHANNEL_COUNT = 4;

export function resizeImageDocument(
  imageDocument: ImageDocument,
  width: number,
  height: number,
  method: InterpolationMethod,
): ImageDocument {
  const targetWidth = Math.max(1, Math.floor(width));
  const targetHeight = Math.max(1, Math.floor(height));
  const pixels = resizePixels(
    imageDocument.pixels,
    imageDocument.width,
    imageDocument.height,
    targetWidth,
    targetHeight,
    method,
  );

  return {
    ...imageDocument,
    width: targetWidth,
    height: targetHeight,
    pixels,
    hasAlpha: hasTransparentPixels(pixels),
    hasMask: hasMaskPixels(pixels),
  };
}

export function resizePixels(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  method: InterpolationMethod,
): Uint8ClampedArray {
  const targetPixels = new Uint8ClampedArray(
    targetWidth * targetHeight * CHANNEL_COUNT,
  );

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = mapTargetCoordinate(x, sourceWidth, targetWidth);
      const sourceY = mapTargetCoordinate(y, sourceHeight, targetHeight);
      const targetIndex = (y * targetWidth + x) * CHANNEL_COUNT;

      if (method === 'nearest') {
        sampleNearest(
          sourcePixels,
          sourceWidth,
          sourceHeight,
          sourceX,
          sourceY,
          targetPixels,
          targetIndex,
        );
      } else {
        sampleBilinear(
          sourcePixels,
          sourceWidth,
          sourceHeight,
          sourceX,
          sourceY,
          targetPixels,
          targetIndex,
        );
      }
    }
  }

  return targetPixels;
}

function sampleNearest(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  sourceX: number,
  sourceY: number,
  targetPixels: Uint8ClampedArray,
  targetIndex: number,
): void {
  const x = clamp(Math.round(sourceX), 0, sourceWidth - 1);
  const y = clamp(Math.round(sourceY), 0, sourceHeight - 1);
  const sourceIndex = (y * sourceWidth + x) * CHANNEL_COUNT;

  copyPixel(sourcePixels, sourceIndex, targetPixels, targetIndex);
}

function sampleBilinear(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  sourceX: number,
  sourceY: number,
  targetPixels: Uint8ClampedArray,
  targetIndex: number,
): void {
  const x0 = clamp(Math.floor(sourceX), 0, sourceWidth - 1);
  const y0 = clamp(Math.floor(sourceY), 0, sourceHeight - 1);
  const x1 = clamp(x0 + 1, 0, sourceWidth - 1);
  const y1 = clamp(y0 + 1, 0, sourceHeight - 1);
  const xWeight = sourceX - x0;
  const yWeight = sourceY - y0;

  for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
    const topLeft =
      sourcePixels[(y0 * sourceWidth + x0) * CHANNEL_COUNT + channel];
    const topRight =
      sourcePixels[(y0 * sourceWidth + x1) * CHANNEL_COUNT + channel];
    const bottomLeft =
      sourcePixels[(y1 * sourceWidth + x0) * CHANNEL_COUNT + channel];
    const bottomRight =
      sourcePixels[(y1 * sourceWidth + x1) * CHANNEL_COUNT + channel];
    const top = lerp(topLeft, topRight, xWeight);
    const bottom = lerp(bottomLeft, bottomRight, xWeight);

    targetPixels[targetIndex + channel] = Math.round(
      lerp(top, bottom, yWeight),
    );
  }
}

function copyPixel(
  sourcePixels: Uint8ClampedArray,
  sourceIndex: number,
  targetPixels: Uint8ClampedArray,
  targetIndex: number,
): void {
  for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
    targetPixels[targetIndex + channel] = sourcePixels[sourceIndex + channel];
  }
}

function mapTargetCoordinate(
  targetCoordinate: number,
  sourceSize: number,
  targetSize: number,
): number {
  if (targetSize <= 1) {
    return 0;
  }

  return clamp(
    ((targetCoordinate + 0.5) * sourceSize) / targetSize - 0.5,
    0,
    sourceSize - 1,
  );
}

function hasTransparentPixels(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += CHANNEL_COUNT) {
    if (pixels[index] < 255) {
      return true;
    }
  }

  return false;
}

function hasMaskPixels(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += CHANNEL_COUNT) {
    if (pixels[index] < 128) {
      return true;
    }
  }

  return false;
}

function lerp(start: number, end: number, weight: number): number {
  return start + (end - start) * weight;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
