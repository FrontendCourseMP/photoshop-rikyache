import type { ImageDocument } from '../core/types/image-document';
import {
  DEFAULT_INTERPOLATION_METHOD,
  type InterpolationMethod,
} from '../core/interpolation/interpolation-types';

export type AppTool = 'pointer' | 'eyedropper' | 'levels' | 'resize';

export interface AppChannels {
  r: boolean;
  g: boolean;
  b: boolean;
  a: boolean;
}

export interface AppState {
  currentDocument: ImageDocument | null;
  activeTool: AppTool;
  channels: AppChannels;
  viewScalePercent: number;
  interpolationMethod: InterpolationMethod;
}

export function createAppState(): AppState {
  return {
    currentDocument: null,
    activeTool: 'pointer',
    channels: { r: true, g: true, b: true, a: true },
    viewScalePercent: 100,
    interpolationMethod: DEFAULT_INTERPOLATION_METHOD,
  };
}

export function setActiveTool(state: AppState, tool: AppTool): void {
  state.activeTool = tool;
}

export function setChannels(state: AppState, channels: Partial<AppChannels>): void {
  state.channels = { ...state.channels, ...channels };
}

export function setViewScalePercent(state: AppState, scalePercent: number): void {
  state.viewScalePercent = scalePercent;
}

export function setInterpolationMethod(
  state: AppState,
  method: InterpolationMethod,
): void {
  state.interpolationMethod = method;
}

export function setCurrentDocument(
  state: AppState,
  imageDocument: ImageDocument | null,
): void {
  state.currentDocument = imageDocument;
}

export function getCurrentDocument(state: AppState): ImageDocument | null {
  return state.currentDocument;
}
