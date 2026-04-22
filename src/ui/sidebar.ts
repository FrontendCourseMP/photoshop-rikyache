import { TOOL_BUTTON_TITLES, TOOL_IDS } from './constants';
import { createElement } from '../utils/dom';
import { ICONS } from './icons';
import type { AppTool } from '../app/app-state';

export interface SidebarElements {
  root: HTMLElement;
  rail: HTMLElement;
  toolButtons: Map<AppTool, HTMLButtonElement>;
}

export function createSidebar(): SidebarElements {
  const root = createElement('aside', 'sidebar');
  const rail = createElement('div', 'sidebar-rail');

  const toolButtons = new Map<AppTool, HTMLButtonElement>();

  TOOL_IDS.forEach((id, index) => {
    const title = TOOL_BUTTON_TITLES[index];
    const button = createElement('button', 'tool-button') as HTMLButtonElement;
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.dataset.toolId = id;

    const iconContainer = createElement('div', 'tool-button-icon');
    iconContainer.innerHTML = ICONS[id as keyof typeof ICONS] || '';
    button.appendChild(iconContainer);

    if (id === 'pointer') {
      button.classList.add('is-active');
    }

    rail.appendChild(button);
    toolButtons.set(id as AppTool, button);
  });

  root.appendChild(rail);

  return {
    root,
    rail,
    toolButtons,
  };
}
