type ToastType = 'success' | 'error' | 'info';
type ToastHandler = (msg: string, type: ToastType) => void;

let _handler: ToastHandler | null = null;

export const toast = {
  success: (msg: string) => _handler?.(msg, 'success'),
  error:   (msg: string) => _handler?.(msg, 'error'),
  info:    (msg: string) => _handler?.(msg, 'info'),
  _register:   (fn: ToastHandler) => { _handler = fn; },
  _unregister: () => { _handler = null; },
};
