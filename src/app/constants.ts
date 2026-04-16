import type { StatusBarData } from '../ui/statusbar';

export const APP_TITLE = 'GrayBit Image Editor';

export const DEFAULT_STATUS: StatusBarData = {
  format: '-',
  width: 0,
  height: 0,
  colorDepth: 0,
  hasMask: false,
};

export const SAVE_NOT_READY_MESSAGE =
  'Сохранение подключим следующим этапом. Сейчас уже исправлены layout, загрузка PNG/JPG и drag & drop.';

export const GB7_NOT_READY_MESSAGE =
  'GB7 подключим следующим этапом. Сейчас уже открываются PNG и JPG/JPEG.';

export const UNSUPPORTED_FORMAT_MESSAGE =
  'Поддерживаются PNG, JPG/JPEG и GB7. Сейчас для просмотра уже работают PNG и JPG/JPEG.';

export const OPEN_FILE_ERROR_FALLBACK =
  'Не удалось открыть изображение.';
