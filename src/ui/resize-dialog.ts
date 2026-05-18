import {
  INTERPOLATION_ALGORITHMS,
  type InterpolationMethod,
} from '../core/interpolation/interpolation-types';
import { resizeImageDocument } from '../core/interpolation/resize-image';
import type { ImageDocument } from '../core/types/image-document';
import { createElement } from '../utils/dom';

interface ResizeDialogCallbacks {
  onApply(imageDocument: ImageDocument, method: InterpolationMethod): void;
}

type ResizeUnit = 'percent' | 'pixels';

const MIN_PIXEL_SIZE = 1;
const MAX_PIXEL_SIZE = 10000;
const MAX_TOTAL_PIXELS = 100_000_000;
const MIN_PERCENT = 1;
const MAX_PERCENT = 1000;

export function openResizeDialog(
  imageDocument: ImageDocument,
  defaultMethod: InterpolationMethod,
  callbacks: ResizeDialogCallbacks,
): void {
  let unit: ResizeUnit = 'percent';
  let keepAspectRatio = true;
  const aspectRatio = imageDocument.width / imageDocument.height;

  const overlay = createElement('div', 'resize-dialog-overlay');
  const dialog = createElement('section', 'resize-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const header = createElement('header', 'resize-dialog-header');
  const title = createElement('h2', 'resize-dialog-title', 'Изменить размер');
  const closeButton = createButton('resize-icon-button', 'Закрыть', '×');
  header.append(title, closeButton);

  const pixelSummary = createElement('div', 'resize-summary');
  const beforePixels = createElement(
    'span',
    undefined,
    `До: ${formatMegapixels(imageDocument.width * imageDocument.height)}`,
  );
  const afterPixels = createElement('span');
  pixelSummary.append(beforePixels, afterPixels);

  const unitSelect = createSelect([
    { value: 'percent', label: 'Проценты' },
    { value: 'pixels', label: 'Пиксели' },
  ]);
  const widthInput = createNumberInput('100');
  const heightInput = createNumberInput('100');
  const aspectCheckbox = document.createElement('input');
  aspectCheckbox.type = 'checkbox';
  aspectCheckbox.checked = true;

  const methodSelect = createSelect(
    INTERPOLATION_ALGORITHMS.map((algorithm) => ({
      value: algorithm.id,
      label: algorithm.label,
    })),
  );
  methodSelect.value = defaultMethod;

  const methodTooltip = createElement('span', 'resize-method-tooltip', '?');
  methodTooltip.tabIndex = 0;

  const errorText = createElement('div', 'resize-error');
  const form = createElement('div', 'resize-form');
  const aspectLabel = createElement('label', 'resize-checkbox-field');
  aspectLabel.append(
    aspectCheckbox,
    createElement('span', undefined, 'Сохранять пропорции'),
  );

  const methodField = createElement('label', 'resize-field');
  const methodLabel = createElement('span', 'resize-field-label', 'Интерполяция');
  const methodRow = createElement('div', 'resize-method-row');
  methodRow.append(methodSelect, methodTooltip);
  methodField.append(methodLabel, methodRow);

  form.append(
    createField('Единицы', unitSelect),
    createField('Ширина', widthInput),
    createField('Высота', heightInput),
    aspectLabel,
    methodField,
  );

  const footer = createElement('footer', 'resize-dialog-footer');
  const cancelButton = createButton('resize-secondary-button', 'Отмена', 'Отмена');
  const applyButton = createButton('resize-primary-button', 'Применить', 'Применить');
  footer.append(cancelButton, applyButton);

  dialog.append(header, pixelSummary, form, errorText, footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = (): void => {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      close();
    }
  };

  unitSelect.addEventListener('change', () => {
    unit = unitSelect.value as ResizeUnit;

    if (unit === 'percent') {
      widthInput.value = '100';
      heightInput.value = '100';
    } else {
      widthInput.value = String(imageDocument.width);
      heightInput.value = String(imageDocument.height);
    }

    updateValidationState();
  });

  aspectCheckbox.addEventListener('change', () => {
    keepAspectRatio = aspectCheckbox.checked;
  });

  widthInput.addEventListener('input', () => {
    if (keepAspectRatio) {
      syncLinkedDimension('width');
    }

    updateValidationState();
  });

  heightInput.addEventListener('input', () => {
    if (keepAspectRatio) {
      syncLinkedDimension('height');
    }

    updateValidationState();
  });

  methodSelect.addEventListener('change', updateTooltip);
  cancelButton.addEventListener('click', close);
  closeButton.addEventListener('click', close);

  applyButton.addEventListener('click', () => {
    const validation = validateTargetSize();

    if (!validation.ok) {
      errorText.textContent = validation.message;
      return;
    }

    callbacks.onApply(
      resizeImageDocument(
        imageDocument,
        validation.width,
        validation.height,
        methodSelect.value as InterpolationMethod,
      ),
      methodSelect.value as InterpolationMethod,
    );
    close();
  });

  document.addEventListener('keydown', handleKeyDown);
  updateTooltip();
  updateValidationState();

  function syncLinkedDimension(changedField: 'width' | 'height'): void {
    if (unit === 'percent') {
      if (changedField === 'width') {
        heightInput.value = widthInput.value;
      } else {
        widthInput.value = heightInput.value;
      }

      return;
    }

    const changedValue = Number(
      changedField === 'width' ? widthInput.value : heightInput.value,
    );

    if (!Number.isFinite(changedValue) || changedValue <= 0) {
      return;
    }

    if (changedField === 'width') {
      heightInput.value = String(Math.max(1, Math.round(changedValue / aspectRatio)));
    } else {
      widthInput.value = String(Math.max(1, Math.round(changedValue * aspectRatio)));
    }
  }

  function updateValidationState(): void {
    const validation = validateTargetSize();

    if (validation.ok) {
      errorText.textContent = '';
      afterPixels.textContent = `После: ${formatMegapixels(validation.width * validation.height)}`;
    } else {
      errorText.textContent = validation.message;
      afterPixels.textContent = 'После: -';
    }
  }

  function validateTargetSize():
    | { ok: true; width: number; height: number }
    | { ok: false; message: string } {
    const rawWidth = Number(widthInput.value);
    const rawHeight = Number(heightInput.value);

    if (!Number.isFinite(rawWidth) || !Number.isFinite(rawHeight)) {
      return { ok: false, message: 'Введите числовые значения ширины и высоты.' };
    }

    if (unit === 'percent') {
      if (
        rawWidth < MIN_PERCENT ||
        rawHeight < MIN_PERCENT ||
        rawWidth > MAX_PERCENT ||
        rawHeight > MAX_PERCENT
      ) {
        return {
          ok: false,
          message: `Проценты должны быть в диапазоне ${MIN_PERCENT}-${MAX_PERCENT}.`,
        };
      }

      return validatePixelBounds(
        Math.round(imageDocument.width * (rawWidth / 100)),
        Math.round(imageDocument.height * (rawHeight / 100)),
      );
    }

    return validatePixelBounds(Math.round(rawWidth), Math.round(rawHeight));
  }

  function validatePixelBounds(
    width: number,
    height: number,
  ): { ok: true; width: number; height: number } | { ok: false; message: string } {
    if (
      width < MIN_PIXEL_SIZE ||
      height < MIN_PIXEL_SIZE ||
      width > MAX_PIXEL_SIZE ||
      height > MAX_PIXEL_SIZE
    ) {
      return {
        ok: false,
        message: `Размер должен быть от ${MIN_PIXEL_SIZE} до ${MAX_PIXEL_SIZE} пикселей.`,
      };
    }

    if (width * height > MAX_TOTAL_PIXELS) {
      return {
        ok: false,
        message: 'Итоговое изображение не должно превышать 100 мегапикселей.',
      };
    }

    return { ok: true, width, height };
  }

  function updateTooltip(): void {
    const algorithm = INTERPOLATION_ALGORITHMS.find(
      (item) => item.id === methodSelect.value,
    );

    methodTooltip.title = algorithm?.description ?? '';
  }
}

function createSelect(options: { value: string; label: string }[]): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'resize-select';

  for (const optionConfig of options) {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.label;
    select.appendChild(option);
  }

  return select;
}

function createNumberInput(value: string): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'resize-number-input';
  input.type = 'number';
  input.min = '1';
  input.value = value;
  return input;
}

function createField(labelText: string, control: HTMLElement): HTMLElement {
  const field = createElement('label', 'resize-field');
  field.append(createElement('span', 'resize-field-label', labelText), control);
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

function formatMegapixels(pixelCount: number): string {
  return `${(pixelCount / 1_000_000).toFixed(2)} MP`;
}
