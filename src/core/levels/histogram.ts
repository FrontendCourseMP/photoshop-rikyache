import type { ImageDocument } from '../types/image-document';
import type { LevelsChannel } from './levels-types';

export function getLevelsMaxValue(imageDocument: ImageDocument): number {
  return imageDocument.colorDepth <= 7 ? 127 : 255;
}

export function calculateHistogram(
  imageDocument: ImageDocument,
  channel: LevelsChannel,
  maxLevel: number,
): number[] {
  const bins = new Array<number>(maxLevel + 1).fill(0);
  const pixels = imageDocument.pixels;

  for (let index = 0; index < pixels.length; index += 4) {
    const value = readChannelValue(pixels, index, channel);
    bins[mapByteToLevel(value, maxLevel)] += 1;
  }

  return bins;
}

function readChannelValue(
  pixels: Uint8ClampedArray,
  index: number,
  channel: LevelsChannel,
): number {
  if (channel === 'red') {
    return pixels[index];
  }

  if (channel === 'green') {
    return pixels[index + 1];
  }

  if (channel === 'blue') {
    return pixels[index + 2];
  }

  if (channel === 'alpha') {
    return pixels[index + 3];
  }

  return Math.round(
    0.299 * pixels[index] +
      0.587 * pixels[index + 1] +
      0.114 * pixels[index + 2],
  );
}

function mapByteToLevel(value: number, maxLevel: number): number {
  return Math.min(maxLevel, Math.max(0, Math.round((value / 255) * maxLevel)));
}
