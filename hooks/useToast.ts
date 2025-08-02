import { useState, useCallback } from 'react';
import { ToastType } from '@/components/common/Toast';

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
  });

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 4000
  ) => {
    setToast({
      visible: true,
      type,
      title,
      message,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Métodos de conveniencia
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showToast('success', title, message, duration);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showToast('error', title, message, duration);
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showToast('warning', title, message, duration);
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showToast('info', title, message, duration);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};