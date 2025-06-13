import { useCallback } from 'react';

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) {
    return '+380';
  }

  if (phone.startsWith('+380')) {
    return phone;
  }

  const cleaned = phone.replace(/\D/g, '');

  if (!cleaned) {
    return '+380';
  }

  if (cleaned.startsWith('380')) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0')) {
    return `+380${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('38')) {
    return '+380';
  }

  return `+380${cleaned}`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length !== 12) {
    return false;
  }

  if (!cleaned.startsWith('380')) {
    return false;
  }

  const operatorCode = cleaned.slice(3, 5);
  const validOperatorCodes = [
    '50',
    '63',
    '66',
    '67',
    '68',
    '73',
    '93',
    '95',
    '96',
    '97',
    '98',
    '99',
  ];

  if (!validOperatorCodes.includes(operatorCode)) {
    return false;
  }

  return true;
};

export const getPhoneErrorMessage = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length !== 12) {
    return 'Phone number must contain 12 digits';
  }

  if (!cleaned.startsWith('380')) {
    return 'Phone number must start with 380';
  }

  const operatorCode = cleaned.slice(3, 5);
  const validOperatorCodes = [
    '50',
    '63',
    '66',
    '67',
    '68',
    '73',
    '93',
    '95',
    '96',
    '97',
    '98',
    '99',
  ];

  if (!validOperatorCodes.includes(operatorCode)) {
    return 'Invalid operator code';
  }

  return null;
};

export const usePhoneInput = (setValue: (value: string) => void) => {
  const handlePhoneInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const prefix = '+380';

      if (value.length < prefix.length) {
        e.target.value = prefix;
        setValue(prefix);
        return;
      }

      if (!value.startsWith(prefix)) {
        e.target.value = prefix + value.replace(prefix, '');
        setValue(prefix + value.replace(prefix, ''));
        return;
      }

      setValue(value);
    },
    [setValue]
  );

  const handlePhoneKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const prefix = '+380';

    if (input.selectionStart && input.selectionStart <= prefix.length) {
      if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
      }
    }
  }, []);

  const handlePhoneClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const prefix = '+380';

    if (input.selectionStart && input.selectionStart <= prefix.length) {
      input.setSelectionRange(prefix.length, prefix.length);
    }
  }, []);

  return {
    handlePhoneInput,
    handlePhoneKeyDown,
    handlePhoneClick,
  };
};
