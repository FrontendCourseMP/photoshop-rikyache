export const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1d] as const;
export const GB7_VERSION = 0x01;
export const GB7_HEADER_SIZE = 12;

export const GB7_MASK_FLAG = 0b00000001;
export const GB7_RESERVED_FLAGS_MASK = 0b11111110;

export const GB7_PIXEL_MASK_BIT = 0b10000000;
export const GB7_PIXEL_GRAY_MASK = 0b01111111;

export const GB7_MAX_GRAY_VALUE = 127;
export const GB7_MAX_CHANNEL_VALUE = 255;