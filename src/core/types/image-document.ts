export type ImageFormat = 'png' | 'jpg' | 'gb7';

export interface ImageDocument {
  name: string;
  width: number;
  height: number;
  colorDepth: number;
  sourceFormat: ImageFormat;
  hasMask: boolean;
  hasAlpha: boolean;
  pixels: Uint8ClampedArray;
}
