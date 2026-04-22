import { createElement } from '../utils/dom';
import type { AppChannels } from '../app/app-state';
import type { ImageDocument } from '../core/types/image-document';

export interface ChannelPanelElements {
  root: HTMLElement;
  channels: Map<keyof AppChannels, { item: HTMLElement; canvas: HTMLCanvasElement }>;
}

export function createChannelsPanel(): ChannelPanelElements {
  const root = createElement('aside', 'channels-panel');
  const title = createElement('div', 'channels-title');
  title.textContent = 'Каналы';
  root.appendChild(title);

  const channels = new Map<keyof AppChannels, { item: HTMLElement; canvas: HTMLCanvasElement }>();
  const channelConfigs: { id: keyof AppChannels; label: string }[] = [
    { id: 'r', label: 'Красный (R)' },
    { id: 'g', label: 'Зеленый (G)' },
    { id: 'b', label: 'Синий (B)' },
    { id: 'a', label: 'Альфа (A)' },
  ];

  channelConfigs.forEach(config => {
    const item = createElement('div', 'channel-item');
    item.classList.add('is-active');
    item.dataset.channelId = config.id;

    const canvas = document.createElement('canvas');
    canvas.className = 'channel-preview';
    
    const label = createElement('div', 'channel-label');
    label.textContent = config.label;

    item.append(canvas, label);
    root.appendChild(item);

    channels.set(config.id, { item, canvas });
  });

  return { root, channels };
}

export function updateChannelPreviews(
  elements: ChannelPanelElements,
  document: ImageDocument | null
): void {
  if (!document) {
    elements.channels.forEach(({ canvas }) => {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    return;
  }

  elements.channels.forEach(({ canvas }, channelId) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = document.width;
    canvas.height = document.height;

    const imageData = ctx.createImageData(document.width, document.height);
    const pixels = document.pixels;
    const data = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (channelId === 'r') {
        data[i] = r; data[i+1] = 0; data[i+2] = 0; data[i+3] = 255;
      } else if (channelId === 'g') {
        data[i] = 0; data[i+1] = g; data[i+2] = 0; data[i+3] = 255;
      } else if (channelId === 'b') {
        data[i] = 0; data[i+1] = 0; data[i+2] = b; data[i+3] = 255;
      } else if (channelId === 'a') {
        data[i] = a; data[i+1] = a; data[i+2] = a; data[i+3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  });
}
