type NotificationKind = 'info' | 'error';

let notificationsRoot: HTMLElement | null = null;

export function showInfo(message: string): void {
  showNotification(message, 'info');
}

export function showError(message: string): void {
  showNotification(message, 'error');
}

function showNotification(message: string, kind: NotificationKind): void {
  const root = ensureNotificationsRoot();

  const item = document.createElement('div');
  item.className = `notification notification--${kind}`;
  item.textContent = message;

  root.appendChild(item);

  requestAnimationFrame(() => {
    item.classList.add('is-visible');
  });

  window.setTimeout(() => {
    item.classList.remove('is-visible');

    window.setTimeout(() => {
      item.remove();
    }, 180);
  }, 2600);
}

function ensureNotificationsRoot(): HTMLElement {
  if (notificationsRoot) {
    return notificationsRoot;
  }

  const root = document.createElement('div');
  root.className = 'notifications';

  document.body.appendChild(root);
  notificationsRoot = root;

  return root;
}
