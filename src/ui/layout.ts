import { FILE_INPUT_ACCEPT } from './constants';
import { createSidebar } from './sidebar';
import { createStatusBar } from './statusbar';
import { createToolbar } from './toolbar';
import { createElement } from '../utils/dom';

export interface AppLayout {
  root: HTMLElement;
  topBar: HTMLElement;
  sideBar: HTMLElement;
  workspace: HTMLElement;
  canvas: HTMLCanvasElement;
  statusBar: HTMLElement;
  fileInput: HTMLInputElement;
  loadButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  saveAsButton: HTMLButtonElement;
}

export function createLayout(container: HTMLElement): AppLayout {
  const root = createElement('div', 'app');

  const toolbar = createToolbar();
  const sidebar = createSidebar();
  const statusBar = createStatusBar();

  const content = createElement('div', 'content');
  const workspace = createElement('main', 'workspace');

  const canvas = document.createElement('canvas');
  canvas.className = 'workspace-canvas';
  canvas.setAttribute('aria-label', 'Область просмотра изображения');

  workspace.appendChild(canvas);
  content.append(sidebar.root, workspace);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = FILE_INPUT_ACCEPT;
  fileInput.hidden = true;

  root.append(toolbar.root, content, statusBar, fileInput);
  container.appendChild(root);

  return {
    root,
    topBar: toolbar.root,
    sideBar: sidebar.root,
    workspace,
    canvas,
    statusBar,
    fileInput,
    loadButton: toolbar.loadButton,
    saveButton: toolbar.saveButton,
    saveAsButton: toolbar.saveAsButton,
  };
}
