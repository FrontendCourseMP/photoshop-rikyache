import { createElement } from '../utils/dom';
import type { AppChannels } from '../app/app-state';
import type { ImageDocument } from '../core/types/image-document';

export interface ChannelPanelElements {
  root: HTMLElement;
  channels: Map<DisplayChannel, { item: HTMLElement; canvas: HTMLCanvasElement }>;
}

export type DisplayChannel = keyof AppChannels | 'gray';

const CHANNEL_CONFIGS: { id: DisplayChannel; label: string }[] = [
  { id: 'gray', label: 'Серый (Gray)' },
  { id: 'r', label: 'Красный (R)' },
  { id: 'g', label: 'Зеленый (G)' },
  { id: 'b', label: 'Синий (B)' },
  { id: 'a', label: 'Альфа (A)' },
];

export function createChannelsPanel(): ChannelPanelElements {
  const root = createElement('aside', 'channels-panel');
  const title = createElement('div', 'channels-title');
  title.textContent = 'Каналы';
  root.appendChild(title);

  const channels = new Map<DisplayChannel, { item: HTMLElement; canvas: HTMLCanvasElement }>();

  CHANNEL_CONFIGS.forEach(config => {
    const item = createElement('div', 'channel-item');
    item.classList.add('is-active');
    item.hidden = true;
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
  imageDocument: ImageDocument | null,
  channelsState: AppChannels,
): void {
  if (!imageDocument) {
    elements.channels.forEach(({ item, canvas }) => {
      item.hidden = true;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    return;
  }

  const availableChannels = new Set<DisplayChannel>(
    imageDocument.colorModel === 'grayscale'
      ? ['gray', ...(imageDocument.hasAlpha ? (['a'] as const) : [])]
      : ['r', 'g', 'b', ...(imageDocument.hasAlpha ? (['a'] as const) : [])],
  );

  elements.channels.forEach(({ item, canvas }, channelId) => {
    item.hidden = !availableChannels.has(channelId);

    if (item.hidden) {
      return;
    }

    const isActive =
      channelId === 'gray'
        ? channelsState.r && channelsState.g && channelsState.b
        : channelsState[channelId];
    item.classList.toggle('is-active', isActive);
    item.classList.toggle('is-disabled', !isActive);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageDocument.width;
    canvas.height = imageDocument.height;

    const imageData = ctx.createImageData(imageDocument.width, imageDocument.height);
    const pixels = imageDocument.pixels;
    const data = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (channelId === 'gray') {
        data[i] = r; data[i+1] = r; data[i+2] = r; data[i+3] = 255;
      } else if (channelId === 'r') {
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
