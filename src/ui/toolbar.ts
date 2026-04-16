import { createElement } from '../utils/dom';

export interface ToolbarElements {
  root: HTMLElement;
  loadButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  saveAsButton: HTMLButtonElement;
}

export function createToolbar(): ToolbarElements {
  const root = createElement('header', 'topbar');

  const loadButton = createToolbarButton('Загрузить');
  const saveButton = createToolbarButton('Сохранить');
  const saveAsButton = createToolbarButton('Сохранить как');

  root.append(loadButton, saveButton, saveAsButton);

  return {
    root,
    loadButton,
    saveButton,
    saveAsButton,
  };
}

function createToolbarButton(label: string): HTMLButtonElement {
  const button = createElement(
    'button',
    'topbar-button',
    label,
  ) as HTMLButtonElement;

  button.type = 'button';

  return button;
}
