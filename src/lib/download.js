/** Blob download helper, with a native save dialog inside Tauri. */

const inTauri = () => typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

const saveWithDialog = async (filename, text) => {
  const [{ save }, { invoke }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/api/core'),
  ]);

  const extension = filename.includes('.') ? filename.split('.').pop() : '';
  const path = await save({
    defaultPath: filename,
    filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : [],
  });

  if (path) await invoke('save_export', { path, contents: text });
};

export const downloadText = async (filename, text, mime) => {
  if (inTauri()) {
    await saveWithDialog(filename, text);
    return;
  }

  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
