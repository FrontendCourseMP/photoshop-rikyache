export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 0);
  }
}

export function replaceFileExtension(fileName: string, extension: string): string {
  const normalizedExtension = extension.startsWith('.')
    ? extension
    : `.${extension}`;

  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex < 0) {
    return `${fileName}${normalizedExtension}`;
  }

  return `${fileName.slice(0, dotIndex)}${normalizedExtension}`;
}