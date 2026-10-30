/** Window-wide drag and drop for font files. */

const hasFiles = (event) => Boolean(event.dataTransfer && Array.from(event.dataTransfer.types || []).includes('Files'));

export const bindDropzone = (ctx) => {
  let depth = 0;

  window.addEventListener('dragenter', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth += 1;
    document.body.classList.add('dragging');
  });

  window.addEventListener('dragover', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('dragleave', () => {
    if (!document.body.classList.contains('dragging')) return;
    depth = Math.max(0, depth - 1);
    if (!depth) document.body.classList.remove('dragging');
  });

  window.addEventListener('dragend', () => {
    depth = 0;
    document.body.classList.remove('dragging');
  });

  window.addEventListener('drop', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth = 0;
    document.body.classList.remove('dragging');
    const files = event.dataTransfer && event.dataTransfer.files;
    if (files && files[0]) ctx.loadFile(files[0]);
  });
};
