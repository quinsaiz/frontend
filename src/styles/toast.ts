import { toast } from 'react-hot-toast';

const baseStyle = {
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  maxWidth: '90vw',
  width: 'auto',
  minWidth: '280px',
};

export const toastConfig = {
  success: {
    style: {
      ...baseStyle,
      background: '#10B981',
      color: 'white',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#10B981',
    },
  },
  error: {
    style: {
      ...baseStyle,
      background: '#EF4444',
      color: 'white',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#EF4444',
    },
  },
};

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    ...toastConfig.success,
    position: 'top-center',
    duration: 4000,
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    ...toastConfig.error,
    position: 'top-center',
    duration: 4000,
  });
};
