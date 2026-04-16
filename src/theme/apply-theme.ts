import { COLORS } from './colors';
import { THEME_LAYOUT } from './layout';

export function applyThemeVariables(): void {
  const root = document.documentElement;

  root.style.setProperty('--color-app-background', COLORS.appBackground);
  root.style.setProperty('--color-topbar-background', COLORS.topBarBackground);
  root.style.setProperty('--color-sidebar-background', COLORS.sidebarBackground);
  root.style.setProperty(
    '--color-workspace-background',
    COLORS.workspaceBackground,
  );
  root.style.setProperty('--color-canvas-background', COLORS.canvasBackground);
  root.style.setProperty(
    '--color-statusbar-background',
    COLORS.statusBarBackground,
  );

  root.style.setProperty('--color-text-primary', COLORS.textPrimary);
  root.style.setProperty('--color-text-secondary', COLORS.textSecondary);
  root.style.setProperty('--color-text-muted', COLORS.textMuted);

  root.style.setProperty('--color-border-strong', COLORS.borderStrong);
  root.style.setProperty('--color-border-soft', COLORS.borderSoft);

  root.style.setProperty('--color-button-ghost-hover', COLORS.buttonGhostHover);
  root.style.setProperty(
    '--color-tool-button-background',
    COLORS.toolButtonBackground,
  );
  root.style.setProperty(
    '--color-tool-button-hover',
    COLORS.toolButtonHover,
  );
  root.style.setProperty('--color-focus-ring', COLORS.focusRing);

  root.style.setProperty(
    '--color-notification-info',
    COLORS.notificationInfo,
  );
  root.style.setProperty(
    '--color-notification-error',
    COLORS.notificationError,
  );

  root.style.setProperty(
    '--layout-topbar-height',
    `${THEME_LAYOUT.topBarHeight}px`,
  );
  root.style.setProperty(
    '--layout-statusbar-height',
    `${THEME_LAYOUT.statusBarHeight}px`,
  );
  root.style.setProperty(
    '--layout-sidebar-width',
    `${THEME_LAYOUT.sidebarWidth}px`,
  );
  root.style.setProperty(
    '--layout-sidebar-width-compact',
    `${THEME_LAYOUT.sidebarWidthCompact}px`,
  );
  root.style.setProperty(
    '--layout-tool-button-size',
    `${THEME_LAYOUT.toolButtonSize}px`,
  );
  root.style.setProperty(
    '--layout-tool-button-size-compact',
    `${THEME_LAYOUT.toolButtonSizeCompact}px`,
  );
  root.style.setProperty(
    '--layout-page-padding',
    `${THEME_LAYOUT.pagePadding}px`,
  );
  root.style.setProperty(
    '--layout-page-padding-compact',
    `${THEME_LAYOUT.pagePaddingCompact}px`,
  );
  root.style.setProperty(
    '--layout-max-canvas-width',
    `${THEME_LAYOUT.maxCanvasWidth}px`,
  );
  root.style.setProperty(
    '--layout-max-canvas-height',
    `${THEME_LAYOUT.maxCanvasHeight}px`,
  );
}
