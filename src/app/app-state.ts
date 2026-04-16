import type { ImageDocument } from '../core/types/image-document';

export interface AppState {
  currentDocument: ImageDocument | null;
}

export function createAppState(): AppState {
  return {
    currentDocument: null,
  };
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