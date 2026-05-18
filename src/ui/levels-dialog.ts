import {
  applyLevelsToDocument,
  cloneImageDocument,
} from '../core/levels/levels-adjustment';
import {
  calculateHistogram,
  getLevelsMaxValue,
} from '../core/levels/histogram';
import {
  MAX_GAMMA,
  MIN_GAMMA,
  createDefaultLevelsState,
  type HistogramScale,
  type LevelsChannel,
  type LevelsState,
} from '../core/levels/levels-types';
import type { ImageDocument } from '../core/types/image-document';
import { createElement } from '../utils/dom';

interface LevelsDialogCallbacks {
  onPreviewChange(imageDocument: ImageDocument): void;
  onApply(imageDocument: ImageDocument): void;
  onCancel(imageDocument: ImageDocument): void;
}

type LevelsHandle = 'black' | 'gamma' | 'white';

const CHANNEL_LABELS: Record<LevelsChannel, string> = {
  master: 'Composite',
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
  alpha: 'Alpha',
};

const CHANNEL_OPTIONS: LevelsChannel[] = [
  'master',
  'red',
  'green',
  'blue',
  'alpha',
];

export function openLevelsDialog(
  imageDocument: ImageDocument,
  callbacks: LevelsDialogCallbacks,
): void {
  const originalDocument = cloneImageDocument(imageDocument);
  const maxLevel = getLevelsMaxValue(originalDocument);
  const levels = createDefaultLevelsState(maxLevel);

  let activeChannel: LevelsChannel = 'master';
  let histogramScale: HistogramScale = 'linear';
  let previewEnabled = true;

  const overlay = createElement('div', 'levels-dialog-overlay');
  const dialog = createElement('section', 'levels-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const header = createElement('header', 'levels-dialog-header');
  const title = createElement('h2', 'levels-dialog-title', 'Уровни');
  const closeButton = createButton('levels-icon-button', 'Закрыть', '×');
  header.append(title, closeButton);

  const controls = createElement('div', 'levels-dialog-controls');
  const channelSelect = createSelect(
    CHANNEL_OPTIONS.map((channel) => ({
      value: channel,
      label: CHANNEL_LABELS[channel],
    })),
  ) as HTMLSelectElement;
  const scaleSelect = createSelect([
    { value: 'linear', label: 'Linear' },
    { value: 'logarithmic', label: 'Logarithmic' },
  ]) as HTMLSelectElement;

  controls.append(
    createField('Канал', channelSelect),
    createField('Шкала', scaleSelect),
  );

  const histogramCanvas = document.createElement('canvas');
  histogramCanvas.className = 'levels-histogram';
  histogramCanvas.width = 512;
  histogramCanvas.height = 180;

  const slider = createElement('div', 'levels-slider');
  const sliderTrack = createElement('div', 'levels-slider-track');
  const blackHandle = createHandle('black');
  const gammaHandle = createHandle('gamma');
  const whiteHandle = createHandle('white');
  sliderTrack.append(blackHandle, gammaHandle, whiteHandle);

  const sliderScale = createElement('div', 'levels-slider-scale');
  const minLabel = createElement('span', undefined, '0');
  const maxLabel = createElement('span', undefined, String(maxLevel));
  sliderScale.append(minLabel, maxLabel);
  slider.append(sliderTrack, sliderScale);

  const readouts = createElement('div', 'levels-readouts');
  const blackReadout = createReadout('Черная точка');
  const gammaReadout = createReadout('Гамма');
  const whiteReadout = createReadout('Белая точка');
  readouts.append(blackReadout.root, gammaReadout.root, whiteReadout.root);

  const previewCheckbox = document.createElement('input');
  previewCheckbox.type = 'checkbox';
  previewCheckbox.checked = true;
  const previewLabel = createElement('label', 'levels-preview-toggle');
  previewLabel.append(previewCheckbox, createElement('span', undefined, 'Предпросмотр'));

  const footer = createElement('footer', 'levels-dialog-footer');
  const resetButton = createButton('levels-secondary-button', 'Сброс', 'Сброс');
  const cancelButton = createButton('levels-secondary-button', 'Отмена', 'Отмена');
  const applyButton = createButton('levels-primary-button', 'Применить', 'Применить');
  footer.append(previewLabel, resetButton, cancelButton, applyButton);

  dialog.append(header, controls, histogramCanvas, slider, readouts, footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const updatePreview = (): void => {
    callbacks.onPreviewChange(
      previewEnabled
        ? applyLevelsToDocument(originalDocument, levels, maxLevel)
        : cloneImageDocument(originalDocument),
    );
  };

  const render = (): void => {
    drawHistogram(
      histogramCanvas,
      calculateHistogram(originalDocument, activeChannel, maxLevel),
      histogramScale,
      activeChannel,
    );
    updateSliderHandles();
    updateReadouts();
  };

  const close = (): void => {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  const cancel = (): void => {
    callbacks.onCancel(cloneImageDocument(originalDocument));
    close();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      cancel();
    }
  };

  channelSelect.addEventListener('change', () => {
    activeChannel = channelSelect.value as LevelsChannel;
    render();
  });

  scaleSelect.addEventListener('change', () => {
    histogramScale = scaleSelect.value as HistogramScale;
    render();
  });

  previewCheckbox.addEventListener('change', () => {
    previewEnabled = previewCheckbox.checked;
    updatePreview();
  });

  resetButton.addEventListener('click', () => {
    const defaults = createDefaultLevelsState(maxLevel);

    for (const channel of CHANNEL_OPTIONS) {
      levels[channel] = defaults[channel];
    }

    render();
    updatePreview();
  });

  cancelButton.addEventListener('click', cancel);
  closeButton.addEventListener('click', cancel);

  applyButton.addEventListener('click', () => {
    callbacks.onApply(applyLevelsToDocument(originalDocument, levels, maxLevel));
    close();
  });

  bindHandleDrag(sliderTrack, blackHandle, 'black');
  bindHandleDrag(sliderTrack, gammaHandle, 'gamma');
  bindHandleDrag(sliderTrack, whiteHandle, 'white');

  document.addEventListener('keydown', handleKeyDown);
  render();
  updatePreview();

  function bindHandleDrag(
    track: HTMLElement,
    handle: HTMLButtonElement,
    handleType: LevelsHandle,
  ): void {
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      updateLevelFromPointer(track, event, handleType);
    });

    handle.addEventListener('pointermove', (event) => {
      if (!handle.hasPointerCapture(event.pointerId)) {
        return;
      }

      updateLevelFromPointer(track, event, handleType);
    });

    handle.addEventListener('pointerup', (event) => {
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
    });
  }

  function updateLevelFromPointer(
    track: HTMLElement,
    event: PointerEvent,
    handleType: LevelsHandle,
  ): void {
    const rect = track.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const level = Math.round(clamp(ratio, 0, 1) * maxLevel);
    const channelLevels = levels[activeChannel];

    if (handleType === 'black') {
      channelLevels.blackPoint = Math.min(level, channelLevels.whitePoint - 1);
    } else if (handleType === 'white') {
      channelLevels.whitePoint = Math.max(level, channelLevels.blackPoint + 1);
    } else {
      const normalized = clamp(
        (level - channelLevels.blackPoint) /
          (channelLevels.whitePoint - channelLevels.blackPoint),
        0.001,
        0.999,
      );
      channelLevels.gamma = clamp(
        Math.log(0.5) / Math.log(normalized),
        MIN_GAMMA,
        MAX_GAMMA,
      );
    }

    render();
    updatePreview();
  }

  function updateSliderHandles(): void {
    const channelLevels = levels[activeChannel];
    const gammaLevel = getGammaHandleLevel(
      channelLevels.blackPoint,
      channelLevels.whitePoint,
      channelLevels.gamma,
    );

    blackHandle.style.left = `${(channelLevels.blackPoint / maxLevel) * 100}%`;
    gammaHandle.style.left = `${(gammaLevel / maxLevel) * 100}%`;
    whiteHandle.style.left = `${(channelLevels.whitePoint / maxLevel) * 100}%`;
  }

  function updateReadouts(): void {
    const channelLevels = levels[activeChannel];

    blackReadout.value.textContent = String(channelLevels.blackPoint);
    gammaReadout.value.textContent = channelLevels.gamma.toFixed(2);
    whiteReadout.value.textContent = String(channelLevels.whitePoint);
  }
}

function drawHistogram(
  canvas: HTMLCanvasElement,
  histogram: number[],
  scale: HistogramScale,
  channel: LevelsChannel,
): void {
  const context = canvas.getContext('2d');

  if (context === null) {
    return;
  }

  const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
  const cssWidth = canvas.clientWidth || canvas.width;
  const cssHeight = canvas.clientHeight || canvas.height;

  canvas.width = Math.floor(cssWidth * pixelRatio);
  canvas.height = Math.floor(cssHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  context.fillStyle = '#141414';
  context.fillRect(0, 0, cssWidth, cssHeight);

  const scaledValues = histogram.map((value) =>
    scale === 'logarithmic' ? Math.log1p(value) : value,
  );
  const maxValue = Math.max(1, ...scaledValues);
  const barWidth = cssWidth / histogram.length;

  context.fillStyle = getHistogramColor(channel);

  for (let index = 0; index < scaledValues.length; index += 1) {
    const height = (scaledValues[index] / maxValue) * (cssHeight - 12);

    context.fillRect(
      Math.floor(index * barWidth),
      cssHeight - height,
      Math.max(1, Math.ceil(barWidth)),
      height,
    );
  }
}

function createSelect(
  options: { value: string; label: string }[],
): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'levels-select';

  for (const optionConfig of options) {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.label;
    select.appendChild(option);
  }

  return select;
}

function createField(labelText: string, control: HTMLElement): HTMLElement {
  const field = createElement('label', 'levels-field');
  field.append(createElement('span', undefined, labelText), control);
  return field;
}

function createHandle(type: LevelsHandle): HTMLButtonElement {
  const handle = createButton(
    `levels-handle levels-handle--${type}`,
    type,
    '',
  );
  handle.dataset.handle = type;
  return handle;
}

function createReadout(label: string): { root: HTMLElement; value: HTMLElement } {
  const root = createElement('div', 'levels-readout');
  const value = createElement('strong');
  root.append(createElement('span', undefined, label), value);
  return { root, value };
}

function createButton(
  className: string,
  label: string,
  text: string,
): HTMLButtonElement {
  const button = createElement('button', className, text) as HTMLButtonElement;
  button.type = 'button';
  button.setAttribute('aria-label', label);
  return button;
}

function getGammaHandleLevel(
  blackPoint: number,
  whitePoint: number,
  gamma: number,
): number {
  const normalized = Math.pow(0.5, 1 / clamp(gamma, MIN_GAMMA, MAX_GAMMA));
  return blackPoint + (whitePoint - blackPoint) * normalized;
}

function getHistogramColor(channel: LevelsChannel): string {
  if (channel === 'red') {
    return '#f45b5b';
  }

  if (channel === 'green') {
    return '#5fcf7b';
  }

  if (channel === 'blue') {
    return '#5f91ff';
  }

  if (channel === 'alpha') {
    return '#d0d0d0';
  }

  return '#f2f2f2';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
