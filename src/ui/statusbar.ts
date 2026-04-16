export interface StatusBarData {
  format: string;
  width: number;
  height: number;
  colorDepth: number;
  hasMask: boolean;
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

  statusBarElement.textContent =
    `Формат: ${data.format} | ` +
    `Разрешение: ${data.width}x${data.height} | ` +
    `Глубина цвета: ${data.colorDepth} бит | ` +
    `Маска: ${maskText}`;
}
