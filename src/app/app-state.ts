import type { ImageDocument } from '../core/types/image-document';

export type AppTool = 'pointer' | 'eyedropper' | 'levels';

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
}

export function createAppState(): AppState {
  return {
    currentDocument: null,
    activeTool: 'pointer',
    channels: { r: true, g: true, b: true, a: true },
  };
}

export function setActiveTool(state: AppState, tool: AppTool): void {
  state.activeTool = tool;
}

export function setChannels(state: AppState, channels: Partial<AppChannels>): void {
  state.channels = { ...state.channels, ...channels };
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
