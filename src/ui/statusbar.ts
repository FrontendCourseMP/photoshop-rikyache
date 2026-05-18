export interface StatusBarData {
  format: string;
  width: number;
  height: number;
  colorDepth: number;
  hasMask: boolean;
  pixelInfo?: {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    a: number;
    lab: { l: number; a: number; b: number };
  };
}

export interface StatusBarElements {
  root: HTMLElement;
  info: HTMLElement;
  zoomRange: HTMLInputElement;
  zoomValue: HTMLElement;
}

export function createStatusBar(): StatusBarElements {
  const statusBar = document.createElement('footer');
  statusBar.className = 'statusbar';

  const info = document.createElement('span');
  info.className = 'statusbar-info';

  const zoomLabel = document.createElement('label');
  zoomLabel.className = 'statusbar-zoom';

  const zoomText = document.createElement('span');
  zoomText.textContent = 'Масштаб';

  const zoomRange = document.createElement('input');
  zoomRange.type = 'range';
  zoomRange.min = '12';
  zoomRange.max = '300';
  zoomRange.step = '1';
  zoomRange.value = '100';

  const zoomValue = document.createElement('strong');
  zoomValue.className = 'statusbar-zoom-value';
  zoomValue.textContent = '100%';

  zoomLabel.append(zoomText, zoomRange, zoomValue);
  statusBar.append(info, zoomLabel);

  return {
    root: statusBar,
    info,
    zoomRange,
    zoomValue,
  };
}

export function updateStatusBar(
  statusBarElement: StatusBarElements,
  data: StatusBarData,
): void {
  const maskText = data.hasMask ? 'да' : 'нет';

  let text = `Формат: ${data.format} | ` +
    `Разрешение: ${data.width}x${data.height} | ` +
    `Глубина цвета: ${data.colorDepth} бит | ` +
    `Маска: ${maskText}`;

  if (data.pixelInfo) {
    const { x, y, r, g, b, lab } = data.pixelInfo;
    text += ` | X: ${Math.round(x)}, Y: ${Math.round(y)} | RGB: (${r}, ${g}, ${b}) | LAB: (${lab.l.toFixed(1)}, ${lab.a.toFixed(1)}, ${lab.b.toFixed(1)})`;
  }

  statusBarElement.info.textContent = text;
}

export function updateZoomStatus(
  statusBarElement: StatusBarElements,
  scalePercent: number,
): void {
  const normalizedScale = String(Math.round(scalePercent));

  statusBarElement.zoomRange.value = normalizedScale;
  statusBarElement.zoomValue.textContent = `${normalizedScale}%`;
}
