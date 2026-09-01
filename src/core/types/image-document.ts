export type ImageFormat = 'png' | 'jpg' | 'gb7';
export type ImageColorModel = 'grayscale' | 'rgb';

export interface ImageDocument {
  name: string;
  width: number;
  height: number;
  colorDepth: number;
  sourceFormat: ImageFormat;
  colorModel: ImageColorModel;
  hasMask: boolean;
  hasAlpha: boolean;
  pixels: Uint8ClampedArray;
}
