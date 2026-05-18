export type InterpolationMethod = 'nearest' | 'bilinear';

export interface InterpolationAlgorithm {
  id: InterpolationMethod;
  label: string;
  description: string;
}

export const INTERPOLATION_ALGORITHMS: InterpolationAlgorithm[] = [
  {
    id: 'nearest',
    label: 'Nearest neighbor',
    description:
      'Fastest method. Preserves hard pixel edges, but can look blocky on photos.',
  },
  {
    id: 'bilinear',
    label: 'Bilinear',
    description:
      'Default method. Blends neighboring pixels for smoother resize results.',
  },
];

export const DEFAULT_INTERPOLATION_METHOD: InterpolationMethod = 'bilinear';
