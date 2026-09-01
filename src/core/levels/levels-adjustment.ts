import type { ImageDocument } from '../types/image-document';
import {
  MAX_GAMMA,
  MIN_GAMMA,
  type ChannelLevels,
  type LevelsState,
} from './levels-types';

export function cloneImageDocument(imageDocument: ImageDocument): ImageDocument {
  return {
    ...imageDocument,
    pixels: new Uint8ClampedArray(imageDocument.pixels),
  };
}

export function applyLevelsToDocument(
  imageDocument: ImageDocument,
  levels: LevelsState,
  maxLevel: number,
): ImageDocument {
  const pixels = new Uint8ClampedArray(imageDocument.pixels);

  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = applyChannelLevels(
      applyChannelLevels(pixels[index], levels.master, maxLevel),
      levels.red,
      maxLevel,
    );
    pixels[index + 1] = applyChannelLevels(
      applyChannelLevels(pixels[index + 1], levels.master, maxLevel),
      levels.green,
      maxLevel,
    );
    pixels[index + 2] = applyChannelLevels(
      applyChannelLevels(pixels[index + 2], levels.master, maxLevel),
      levels.blue,
      maxLevel,
    );
    pixels[index + 3] = applyChannelLevels(
      pixels[index + 3],
      levels.alpha,
      maxLevel,
    );
  }

  return {
    ...imageDocument,
    pixels,
  };
}

function applyChannelLevels(
  value: number,
  levels: ChannelLevels,
  maxLevel: number,
): number {
  const inputLevel = (value / 255) * maxLevel;
  const inputRange = Math.max(1, levels.whitePoint - levels.blackPoint);
  const normalized = clamp01((inputLevel - levels.blackPoint) / inputRange);
  const gamma = clamp(levels.gamma, MIN_GAMMA, MAX_GAMMA);
  const adjusted = Math.pow(normalized, gamma);

  return Math.round(adjusted * 255);
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
