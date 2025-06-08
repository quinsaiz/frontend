import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import type { ResetPasswordRequest, PasswordResetConfirmRequest } from '../types/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { showSuccessToast, showErrorToast } from '../styles/toast';
import type { AxiosError } from 'axios';
import {
  formatPhoneNumber,
  validatePhoneNumber,
  getPhoneErrorMessage,
  usePhoneInput,
} from '../hooks/usePhone';
import { FormError } from '../components/FormError';

interface VerificationForm {
  code: string;
  new_password: string;
}

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [verificationAttempts, setVerificationAttempts] = useState(3);
  const navigate = useNavigate();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordRequest>({ defaultValues: { phone: '+380' } });

  const verificationForm = useForm<VerificationForm>();

  const { handlePhoneInput, handlePhoneKeyDown, handlePhoneClick } = usePhoneInput((value) => {
    setValue('phone', value, { shouldValidate: true });
  });

  const onSubmit = async (data: ResetPasswordRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedData = {
        ...data,
        phone: formatPhoneNumber(data.phone),
      };
      setPhone(formattedData.phone);
      setIsVerificationSent(true);
      showSuccessToast('Код підтвердження відправлено');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Помилка запиту на скидання паролю');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitVerification = async (data: VerificationForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const confirmData: PasswordResetConfirmRequest = {
        phone,
        code: data.code,
        new_password: data.new_password,
      };
      await authService.confirmPasswordReset(confirmData);
      showSuccessToast('Пароль успішно змінено');
      navigate('/login');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Помилка підтвердження коду');
      }

      setVerificationAttempts((prev) => {
        const newAttempts = prev - 1;
        if (newAttempts <= 0) {
          showErrorToast('Вичерпано всі спроби. Спробуйте відновити пароль знову.');
          navigate('/');
          return 3;
        }
        return newAttempts;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="container-responsive">
        <div className="card">
          <h2 className="form-title">Скидання паролю</h2>
          {error && <FormError message={error} onClose={() => setError(null)} />}
          {!isVerificationSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1 group">
                <label htmlFor="phone" className="form-label group-focus-within:text-primary">
                  Номер телефону
                </label>
                <div className="relative">
                  <input
                    {...registerField('phone', {
                      required: "Це поле обов'язкове",
                      validate: {
                        validPhone: (value) => {
                          if (!validatePhoneNumber(value)) {
                            return getPhoneErrorMessage(value) || 'Невірний формат номера';
                          }
                          return true;
                        },
                      },
                    })}
                    type="tel"
                    id="phone"
                    className="input-field"
                    placeholder="+380XXXXXXXXX"
                    onChange={handlePhoneInput}
                    onKeyDown={handlePhoneKeyDown}
                    onClick={handlePhoneClick}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Завантаження...' : 'Відправити код'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => navigate('/login')} className="link-primary">
                    Повернутися до входу
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form
              onSubmit={verificationForm.handleSubmit(onSubmitVerification)}
              className="space-y-4"
            >
              <div className="space-y-1 group">
                <label htmlFor="code" className="form-label group-focus-within:text-primary">
                  Код підтвердження
                </label>
                <input
                  {...verificationForm.register('code', {
                    required: "Це поле обов'язкове",
                  })}
                  type="text"
                  id="code"
                  className="input-field"
                  placeholder="Введіть код підтвердження"
                />
                {verificationForm.formState.errors.code && (
                  <p className="mt-0.5 text-sm text-red-400">
                    {verificationForm.formState.errors.code.message}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Залишилось спроб: {verificationAttempts}
                </p>
              </div>

              <div className="space-y-1 group">
                <label
                  htmlFor="new_password"
                  className="form-label group-focus-within:text-primary"
                >
                  Новий пароль
                </label>
                <div className="relative">
                  <input
                    {...verificationForm.register('new_password', {
                      required: "Це поле обов'язкове",
                      minLength: {
                        value: 6,
                        message: 'Пароль повинен містити мінімум 6 символів',
                      },
                      pattern: {
                        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
                        message: 'Пароль повинен містити тільки латинські літери та цифри',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="new_password"
                    className="input-field"
                    placeholder="Введіть новий пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 icon-minimal"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {verificationForm.formState.errors.new_password && (
                  <p className="mt-0.5 text-sm text-red-400">
                    {verificationForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Завантаження...' : 'Змінити пароль'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => navigate('/login')} className="link-primary">
                    Повернутися до входу
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
