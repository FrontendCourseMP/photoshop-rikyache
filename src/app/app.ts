import {
  APP_TITLE,
  DEFAULT_STATUS,
  INVALID_SAVE_FORMAT_MESSAGE,
  NO_DOCUMENT_TO_SAVE_MESSAGE,
  OPEN_FILE_ERROR_FALLBACK,
  SAVE_AS_PROMPT_MESSAGE,
  SAVE_FILE_ERROR_FALLBACK,
  UNSUPPORTED_FORMAT_MESSAGE,
} from './constants';
import {
  createAppState,
  getCurrentDocument,
  setCurrentDocument,
} from './app-state';
import { createCanvasRenderer } from '../core/canvas/canvas-renderer';
import { CANVAS_RENDERING } from '../core/canvas/constants';
import { decodeBrowserImageFile } from '../core/codecs/browser/browser-decoder';
import {
  encodeBrowserImageDocument,
  type BrowserEncodableFormat,
} from '../core/codecs/browser/browser-encoder';
import { decodeGb7File } from '../core/codecs/gb7/gb7-decoder';
import { encodeGb7ImageDocument } from '../core/codecs/gb7/gb7-encoder';
import { downloadBlob, replaceFileExtension } from '../core/file/file-download';
import { detectSupportedImageFormat } from '../core/file/file-format';
import type { ImageDocument, ImageFormat } from '../core/types/image-document';
import { applyThemeVariables } from '../theme/apply-theme';
import { THEME_LAYOUT } from '../theme/layout';
import { createLayout, type AppLayout } from '../ui/layout';
import { showError } from '../ui/notifications';
import { updateStatusBar } from '../ui/statusbar';

export function createApp(): void {
  applyThemeVariables();
  document.title = APP_TITLE;

  const state = createAppState();
  const layout = createLayout(document.body);
  const renderer = createCanvasRenderer(layout.canvas);

  updateStatusBar(layout.statusBar, DEFAULT_STATUS);

  bindCanvasResize(layout, renderer);
  bindToolbarActions(layout, state, renderer);
  bindDragAndDrop(layout, state, renderer);
}

function bindCanvasResize(
  layout: AppLayout,
  renderer: ReturnType<typeof createCanvasRenderer>,
): void {
  const resizeCanvas = (): void => {
    const workspaceRect = layout.workspace.getBoundingClientRect();

    const availableWidth = Math.max(
      1,
      Math.floor(workspaceRect.width - THEME_LAYOUT.pagePadding * 2),
    );

    const availableHeight = Math.max(
      1,
      Math.floor(workspaceRect.height - THEME_LAYOUT.pagePadding * 2),
    );

    const nextWidth =
      availableWidth > 1
        ? Math.min(availableWidth, THEME_LAYOUT.maxCanvasWidth)
        : CANVAS_RENDERING.fallbackViewportWidth;

    const nextHeight =
      availableHeight > 1
        ? Math.min(availableHeight, THEME_LAYOUT.maxCanvasHeight)
        : CANVAS_RENDERING.fallbackViewportHeight;

    renderer.resize(nextWidth, nextHeight);
  };

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });

  resizeObserver.observe(layout.workspace);
  resizeCanvas();
}

function bindToolbarActions(
  layout: AppLayout,
  state: ReturnType<typeof createAppState>,
  renderer: ReturnType<typeof createCanvasRenderer>,
): void {
  layout.loadButton.addEventListener('click', () => {
    layout.fileInput.click();
  });

  layout.fileInput.addEventListener('change', async () => {
    const selectedFile = layout.fileInput.files?.[0];
    layout.fileInput.value = '';

    if (!selectedFile) {
      return;
    }

    await openFile(selectedFile, layout, state, renderer);
  });

  layout.saveButton.addEventListener('click', async () => {
    await saveCurrentDocument(state);
  });

  layout.saveAsButton.addEventListener('click', async () => {
    await saveCurrentDocumentAs(state);
  });
}

function bindDragAndDrop(
  layout: AppLayout,
  state: ReturnType<typeof createAppState>,
  renderer: ReturnType<typeof createCanvasRenderer>,
): void {
  let dragDepth = 0;

  layout.workspace.addEventListener('dragenter', (event) => {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepth += 1;
    layout.canvas.classList.add('is-drag-over');
  });

  layout.workspace.addEventListener('dragover', (event) => {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    layout.canvas.classList.add('is-drag-over');
  });

  layout.workspace.addEventListener('dragleave', (event) => {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);

    if (dragDepth === 0) {
      layout.canvas.classList.remove('is-drag-over');
    }
  });

  layout.workspace.addEventListener('drop', async (event) => {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepth = 0;
    layout.canvas.classList.remove('is-drag-over');

    const droppedFile = event.dataTransfer?.files?.[0];

    if (!droppedFile) {
      return;
    }

    await openFile(droppedFile, layout, state, renderer);
  });
}

async function openFile(
  file: File,
  layout: AppLayout,
  state: ReturnType<typeof createAppState>,
  renderer: ReturnType<typeof createCanvasRenderer>,
): Promise<void> {
  const format = detectSupportedImageFormat(file.name);

  if (format === 'unknown') {
    showError(UNSUPPORTED_FORMAT_MESSAGE);
    return;
  }

  try {
    const imageDocument =
      format === 'gb7'
        ? await decodeGb7File(file)
        : await decodeBrowserImageFile(file);

    setCurrentDocument(state, imageDocument);
    renderer.setDocument(imageDocument);
    syncStatusBar(layout, imageDocument);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : OPEN_FILE_ERROR_FALLBACK;

    showError(message);
  }
}

async function saveCurrentDocument(
  state: ReturnType<typeof createAppState>,
): Promise<void> {
  const currentDocument = getCurrentDocument(state);

  if (currentDocument === null) {
    showError(NO_DOCUMENT_TO_SAVE_MESSAGE);
    return;
  }

  try {
    const blob = await encodeDocumentByFormat(
      currentDocument,
      currentDocument.sourceFormat,
    );

    const fileName = replaceFileExtension(
      currentDocument.name,
      currentDocument.sourceFormat,
    );

    downloadBlob(blob, fileName);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : SAVE_FILE_ERROR_FALLBACK;

    showError(message);
  }
}

async function saveCurrentDocumentAs(
  state: ReturnType<typeof createAppState>,
): Promise<void> {
  const currentDocument = getCurrentDocument(state);

  if (currentDocument === null) {
    showError(NO_DOCUMENT_TO_SAVE_MESSAGE);
    return;
  }

  const requestedFormat = requestSaveFormat();

  if (requestedFormat === null) {
    return;
  }

  try {
    const blob = await encodeDocumentByFormat(currentDocument, requestedFormat);
    const fileName = replaceFileExtension(currentDocument.name, requestedFormat);

    downloadBlob(blob, fileName);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : SAVE_FILE_ERROR_FALLBACK;

    showError(message);
  }
}

async function encodeDocumentByFormat(
  imageDocument: ImageDocument,
  format: ImageFormat,
): Promise<Blob> {
  if (format === 'png' || format === 'jpg') {
    return await encodeBrowserImageDocument(
      imageDocument,
      format as BrowserEncodableFormat,
    );
  }

  return await encodeGb7ImageDocument(imageDocument);
}

function requestSaveFormat(): ImageFormat | null {
  const response = window.prompt(
    SAVE_AS_PROMPT_MESSAGE,
    'png',
  );

  if (response === null) {
    return null;
  }

  const normalized = response.trim().toLowerCase();

  if (normalized === 'png' || normalized === 'jpg' || normalized === 'gb7') {
    return normalized;
  }

  showError(INVALID_SAVE_FORMAT_MESSAGE);
  return null;
}

function syncStatusBar(layout: AppLayout, imageDocument: ImageDocument): void {
  updateStatusBar(layout.statusBar, {
    format: imageDocument.sourceFormat.toUpperCase(),
    width: imageDocument.width,
    height: imageDocument.height,
    colorDepth: imageDocument.colorDepth,
    hasMask: imageDocument.hasMask,
  });
}

function containsFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}
