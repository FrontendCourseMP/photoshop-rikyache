import { TOOL_BUTTON_TITLES } from './constants';
import { createElement } from '../utils/dom';

export interface SidebarElements {
  root: HTMLElement;
  rail: HTMLElement;
  toolButtons: HTMLButtonElement[];
}

export function createSidebar(): SidebarElements {
  const root = createElement('aside', 'sidebar');
  const rail = createElement('div', 'sidebar-rail');

  const toolButtons: HTMLButtonElement[] = [];

  for (const title of TOOL_BUTTON_TITLES) {
    const button = createElement('button', 'tool-button') as HTMLButtonElement;
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);

    rail.appendChild(button);
    toolButtons.push(button);
  }

  root.appendChild(rail);

  return {
    root,
    rail,
    toolButtons,
  };
}
