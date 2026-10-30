/** Toast notifications, using the popover API when available. */

export const createToast = (node) => {
  let timer = 0;

  const hide = () => {
    node.classList.remove('show');
    if (typeof node.hidePopover === 'function') {
      try {
        if (node.matches(':popover-open')) node.hidePopover();
      } catch (error) {
        // ignore
      }
    }
  };

  const show = (message, isError) => {
    node.textContent = message;
    node.classList.toggle('error', Boolean(isError));
    node.classList.add('show');
    if (typeof node.showPopover === 'function') {
      try {
        if (!node.matches(':popover-open')) node.showPopover();
      } catch (error) {
        // ignore: `.show` still displays it
      }
    }
    clearTimeout(timer);
    timer = setTimeout(hide, 2300);
  };

  return { show, hide };
};
