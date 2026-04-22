export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // Normalize RGB values to [0, 1]
  let rf = r / 255;
  let gf = g / 255;
  let bf = b / 255;

  // Gamma correction (sRGB to linear RGB)
  rf = rf > 0.04045 ? Math.pow((rf + 0.055) / 1.055, 2.4) : rf / 12.92;
  gf = gf > 0.04045 ? Math.pow((gf + 0.055) / 1.055, 2.4) : gf / 12.92;
  bf = bf > 0.04045 ? Math.pow((bf + 0.055) / 1.055, 2.4) : bf / 12.92;

  // Linear RGB to XYZ (using D65 illuminant)
  let x = rf * 0.4124 + gf * 0.3576 + bf * 0.1805;
  let y = rf * 0.2126 + gf * 0.7152 + bf * 0.0722;
  let z = rf * 0.0193 + gf * 0.1192 + bf * 0.9505;

  // XYZ to Lab
  // D65 white point: [95.047, 100.0, 108.883]
  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}
