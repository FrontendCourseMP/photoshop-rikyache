import { applyKernelFilter } from '../core/filters/kernel-filter';
import {
  FILTER_CHANNELS,
  KERNEL_PRESETS,
  type EdgeHandling,
  type FilterChannel,
  type FilterMode,
  type KernelFilterOptions,
} from '../core/filters/filter-types';
import type { ImageDocument } from '../core/types/image-document';
import { createElement } from '../utils/dom';

interface FilterDialogCallbacks {
  onPreviewChange(imageDocument: ImageDocument): void;
  onApply(imageDocument: ImageDocument): void;
  onCancel(imageDocument: ImageDocument): void;
}

const CHANNEL_LABELS: Record<FilterChannel, string> = {
  r: 'Red',
  g: 'Green',
  b: 'Blue',
  a: 'Alpha',
};

const DEFAULT_EDGE_HANDLING: EdgeHandling = 'copy';
const DEFAULT_PRESET_ID = 'identity';

export function openFilterDialog(
  imageDocument: ImageDocument,
  callbacks: FilterDialogCallbacks,
): void {
  const originalDocument = cloneImageDocument(imageDocument);
  let previewEnabled = true;
  let activePreviewRequest = 0;

  const overlay = createElement('div', 'filter-dialog-overlay');
  const dialog = createElement('section', 'filter-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const header = createElement('header', 'filter-dialog-header');
  const title = createElement('h2', 'filter-dialog-title', 'Фильтр');
  const closeButton = createButton('filter-icon-button', 'Закрыть', '×');
  header.append(title, closeButton);

  const presetSelect = createSelect(
    KERNEL_PRESETS.map((preset) => ({
      value: preset.id,
      label: preset.label,
    })),
  );
  presetSelect.value = DEFAULT_PRESET_ID;

  const edgeSelect = createSelect([
    { value: 'copy', label: 'Копирование края' },
    { value: 'black', label: 'Черная заливка' },
    { value: 'white', label: 'Белая заливка' },
  ]);
  edgeSelect.value = DEFAULT_EDGE_HANDLING;

  const controls = createElement('div', 'filter-controls');
  controls.append(
    createField('Предустановка', presetSelect),
    createField('Обработка края', edgeSelect),
  );

  const kernelGrid = createElement('div', 'filter-kernel-grid');
  const kernelInputs = Array.from({ length: 9 }, () => createKernelInput());
  kernelGrid.append(...kernelInputs);

  const channelGroup = createElement('fieldset', 'filter-channel-group');
  const channelLegend = createElement('legend', undefined, 'Каналы');
  const channelCheckboxes = new Map<FilterChannel, HTMLInputElement>();
  const channelList = createElement('div', 'filter-channel-list');

  for (const channel of FILTER_CHANNELS) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    channelCheckboxes.set(channel, checkbox);

    const label = createElement('label', 'filter-channel-option');
    label.append(checkbox, createElement('span', undefined, CHANNEL_LABELS[channel]));
    channelList.appendChild(label);
  }

  channelGroup.append(channelLegend, channelList);

  const previewCheckbox = document.createElement('input');
  previewCheckbox.type = 'checkbox';
  previewCheckbox.checked = true;
  const previewLabel = createElement('label', 'filter-preview-toggle');
  previewLabel.append(previewCheckbox, createElement('span', undefined, 'Предпросмотр'));

  const statusText = createElement('div', 'filter-status');
  const footer = createElement('footer', 'filter-dialog-footer');
  const resetButton = createButton('filter-secondary-button', 'Сбросить', 'Сбросить');
  const cancelButton = createButton('filter-secondary-button', 'Отмена', 'Отмена');
  const applyButton = createButton('filter-primary-button', 'Применить', 'Применить');
  footer.append(previewLabel, resetButton, cancelButton, applyButton);

  dialog.append(header, controls, kernelGrid, channelGroup, statusText, footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = (): void => {
    activePreviewRequest += 1;
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

  const schedulePreview = (): void => {
    void updatePreview();
  };

  presetSelect.addEventListener('change', () => {
    applySelectedPreset();
    schedulePreview();
  });

  edgeSelect.addEventListener('change', schedulePreview);

  for (const input of kernelInputs) {
    input.addEventListener('input', schedulePreview);
  }

  for (const checkbox of channelCheckboxes.values()) {
    checkbox.addEventListener('change', schedulePreview);
  }

  previewCheckbox.addEventListener('change', () => {
    previewEnabled = previewCheckbox.checked;

    if (!previewEnabled) {
      activePreviewRequest += 1;
      callbacks.onPreviewChange(cloneImageDocument(originalDocument));
      return;
    }

    schedulePreview();
  });

  resetButton.addEventListener('click', () => {
    presetSelect.value = DEFAULT_PRESET_ID;
    edgeSelect.value = DEFAULT_EDGE_HANDLING;
    previewCheckbox.checked = true;
    previewEnabled = true;

    for (const checkbox of channelCheckboxes.values()) {
      checkbox.checked = true;
    }

    applySelectedPreset();
    schedulePreview();
  });

  cancelButton.addEventListener('click', cancel);
  closeButton.addEventListener('click', cancel);

  applyButton.addEventListener('click', async () => {
    const options = readFilterOptions();

    if (options === null) {
      return;
    }

    setProcessing(true);

    try {
      callbacks.onApply(await applyKernelFilter(originalDocument, options));
      close();
    } catch (error) {
      statusText.textContent =
        error instanceof Error ? error.message : 'Не удалось применить фильтр.';
    } finally {
      setProcessing(false);
    }
  });

  document.addEventListener('keydown', handleKeyDown);
  applySelectedPreset();
  schedulePreview();

  async function updatePreview(): Promise<void> {
    const requestId = activePreviewRequest + 1;
    activePreviewRequest = requestId;

    if (!previewEnabled) {
      return;
    }

    const options = readFilterOptions();

    if (options === null) {
      return;
    }

    statusText.textContent = 'Обработка...';

    try {
      const filteredDocument = await applyKernelFilter(originalDocument, options);

      if (requestId !== activePreviewRequest || !previewEnabled) {
        return;
      }

      callbacks.onPreviewChange(filteredDocument);
      statusText.textContent = '';
    } catch (error) {
      if (requestId === activePreviewRequest) {
        statusText.textContent =
          error instanceof Error ? error.message : 'Не удалось построить предпросмотр.';
      }
    }
  }

  function readFilterOptions(): KernelFilterOptions | null {
    const selectedPreset = findSelectedPreset();
    const channels = FILTER_CHANNELS.filter(
      (channel) => channelCheckboxes.get(channel)?.checked,
    );

    if (channels.length === 0) {
      statusText.textContent = 'Выберите хотя бы один канал.';
      return null;
    }

    const kernel = kernelInputs.map((input) => Number(input.value));

    if (kernel.some((value) => !Number.isFinite(value))) {
      statusText.textContent = 'Все значения ядра должны быть числами.';
      return null;
    }

    statusText.textContent = '';

    return {
      mode: selectedPreset.mode,
      kernel,
      channels,
      edgeHandling: edgeSelect.value as EdgeHandling,
    };
  }

  function applySelectedPreset(): void {
    const selectedPreset = findSelectedPreset();

    for (let index = 0; index < kernelInputs.length; index += 1) {
      kernelInputs[index].value = formatKernelValue(selectedPreset.kernel[index]);
      kernelInputs[index].disabled = selectedPreset.mode === 'median';
    }

    kernelGrid.classList.toggle('is-disabled', selectedPreset.mode === 'median');
  }

  function findSelectedPreset(): { mode: FilterMode; kernel: number[] } {
    return (
      KERNEL_PRESETS.find((preset) => preset.id === presetSelect.value) ??
      KERNEL_PRESETS[0]
    );
  }

  function setProcessing(isProcessing: boolean): void {
    applyButton.disabled = isProcessing;
    resetButton.disabled = isProcessing;
    presetSelect.disabled = isProcessing;
    edgeSelect.disabled = isProcessing;

    for (const input of kernelInputs) {
      input.disabled = isProcessing || findSelectedPreset().mode === 'median';
    }

    for (const checkbox of channelCheckboxes.values()) {
      checkbox.disabled = isProcessing;
    }
  }
}

function createKernelInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'filter-kernel-input';
  input.type = 'number';
  input.step = '0.0625';
  return input;
}

function createSelect(options: { value: string; label: string }[]): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'filter-select';

  for (const optionConfig of options) {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.label;
    select.appendChild(option);
  }

  return select;
}

function createField(labelText: string, control: HTMLElement): HTMLElement {
  const field = createElement('label', 'filter-field');
  field.append(createElement('span', 'filter-field-label', labelText), control);
  return field;
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

function cloneImageDocument(imageDocument: ImageDocument): ImageDocument {
  return {
    ...imageDocument,
    pixels: new Uint8ClampedArray(imageDocument.pixels),
  };
}

function formatKernelValue(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}
