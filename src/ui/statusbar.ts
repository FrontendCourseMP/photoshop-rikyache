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

export function createStatusBar(): HTMLElement {
  const statusBar = document.createElement('footer');
  statusBar.className = 'statusbar';
  return statusBar;
}

export function updateStatusBar(
  statusBarElement: HTMLElement,
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

  statusBarElement.textContent = text;
}
