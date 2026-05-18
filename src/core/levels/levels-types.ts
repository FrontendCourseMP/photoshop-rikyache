export type LevelsChannel = 'master' | 'red' | 'green' | 'blue' | 'alpha';

export type HistogramScale = 'linear' | 'logarithmic';

export interface ChannelLevels {
  blackPoint: number;
  whitePoint: number;
  gamma: number;
}

export type LevelsState = Record<LevelsChannel, ChannelLevels>;

export const LEVELS_CHANNELS: LevelsChannel[] = [
  'master',
  'red',
  'green',
  'blue',
  'alpha',
];

export const DEFAULT_GAMMA = 1;
export const MIN_GAMMA = 0.1;
export const MAX_GAMMA = 9.9;

export function createDefaultChannelLevels(maxLevel: number): ChannelLevels {
  return {
    blackPoint: 0,
    whitePoint: maxLevel,
    gamma: DEFAULT_GAMMA,
  };
}

export function createDefaultLevelsState(maxLevel: number): LevelsState {
  return LEVELS_CHANNELS.reduce((state, channel) => {
    state[channel] = createDefaultChannelLevels(maxLevel);
    return state;
  }, {} as LevelsState);
}
