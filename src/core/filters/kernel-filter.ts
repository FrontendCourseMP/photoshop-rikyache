import type { ImageDocument } from '../types/image-document';
import type {
  EdgeHandling,
  FilterChannel,
  KernelFilterOptions,
} from './filter-types';

const CHANNEL_COUNT = 4;
const CHANNEL_INDEX: Record<FilterChannel, number> = {
  r: 0,
  g: 1,
  b: 2,
  a: 3,
};

export async function applyKernelFilter(
  imageDocument: ImageDocument,
  options: KernelFilterOptions,
): Promise<ImageDocument> {
  validateKernel(options.kernel);

  const selectedChannels = new Set(options.channels.map((channel) => CHANNEL_INDEX[channel]));
  const sourcePixels = imageDocument.pixels;
  const targetPixels = new Uint8ClampedArray(sourcePixels);

  for (let y = 0; y < imageDocument.height; y += 1) {
    for (let x = 0; x < imageDocument.width; x += 1) {
      const targetIndex = getPixelIndex(x, y, imageDocument.width);

      for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
        if (!selectedChannels.has(channel)) {
          continue;
        }

        targetPixels[targetIndex + channel] =
          options.mode === 'median'
            ? applyMedianAt(
                sourcePixels,
                imageDocument.width,
                imageDocument.height,
                x,
                y,
                channel,
                options.edgeHandling,
              )
            : applyKernelAt(
                sourcePixels,
                imageDocument.width,
                imageDocument.height,
                x,
                y,
                channel,
                options.kernel,
                options.edgeHandling,
              );
      }
    }

    if (y % 24 === 0) {
      await yieldToBrowser();
    }
  }

  return {
    ...imageDocument,
    pixels: targetPixels,
  };
}

function applyKernelAt(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
  kernel: number[],
  edgeHandling: EdgeHandling,
): number {
  let value = 0;

  for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
    for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
      const kernelIndex = (kernelY + 1) * 3 + (kernelX + 1);
      const sample = readPixelChannel(
        pixels,
        width,
        height,
        x + kernelX,
        y + kernelY,
        channel,
        edgeHandling,
      );

      value += sample * kernel[kernelIndex];
    }
  }

  return clampByte(Math.round(value));
}

function applyMedianAt(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
  edgeHandling: EdgeHandling,
): number {
  const values: number[] = [];

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      values.push(
        readPixelChannel(
          pixels,
          width,
          height,
          x + offsetX,
          y + offsetY,
          channel,
          edgeHandling,
        ),
      );
    }
  }

  values.sort((left, right) => left - right);
  return values[4];
}

function readPixelChannel(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
  edgeHandling: EdgeHandling,
): number {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    return pixels[getPixelIndex(x, y, width) + channel];
  }

  if (edgeHandling === 'black') {
    return channel === 3 ? 255 : 0;
  }

  if (edgeHandling === 'white') {
    return 255;
  }

  const clampedX = clamp(x, 0, width - 1);
  const clampedY = clamp(y, 0, height - 1);

  return pixels[getPixelIndex(clampedX, clampedY, width) + channel];
}

function validateKernel(kernel: number[]): void {
  if (kernel.length !== 9 || kernel.some((value) => !Number.isFinite(value))) {
    throw new Error('Ядро фильтра должно содержать 9 числовых значений.');
  }
}

function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * CHANNEL_COUNT;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function clampByte(value: number): number {
  return clamp(value, 0, 255);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
