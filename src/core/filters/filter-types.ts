export type FilterChannel = 'r' | 'g' | 'b' | 'a';

export type EdgeHandling = 'black' | 'white' | 'copy';

export type FilterMode = 'kernel' | 'median';

export interface KernelPreset {
  id: string;
  label: string;
  mode: FilterMode;
  kernel: number[];
}

export interface KernelFilterOptions {
  mode: FilterMode;
  kernel: number[];
  channels: FilterChannel[];
  edgeHandling: EdgeHandling;
}

export const FILTER_CHANNELS: FilterChannel[] = ['r', 'g', 'b', 'a'];

export const KERNEL_PRESETS: KernelPreset[] = [
  {
    id: 'identity',
    label: 'Тождественное отображение',
    mode: 'kernel',
    kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  },
  {
    id: 'sharpen',
    label: 'Повышение резкости',
    mode: 'kernel',
    kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  },
  {
    id: 'gaussian-3x3',
    label: 'Фильтр Гаусса 3x3',
    mode: 'kernel',
    kernel: [1 / 16, 2 / 16, 1 / 16, 2 / 16, 4 / 16, 2 / 16, 1 / 16, 2 / 16, 1 / 16],
  },
  {
    id: 'box-blur',
    label: 'Прямоугольное размытие',
    mode: 'kernel',
    kernel: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
  },
  {
    id: 'prewitt-x',
    label: 'Оператор Прюитта X',
    mode: 'kernel',
    kernel: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  },
  {
    id: 'prewitt-y',
    label: 'Оператор Прюитта Y',
    mode: 'kernel',
    kernel: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  },
  {
    id: 'median-3x3',
    label: 'Медианная фильтрация 3x3',
    mode: 'median',
    kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
];
