import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { showSuccessToast } from '../styles/toast';
import type { AxiosError } from 'axios';
import { FormError } from './FormError';

interface ChangePassword {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ChangePasswordProps {
  onClose: () => void;
}

export const ChangePassword = ({ onClose }: ChangePasswordProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePassword>();

  const onSubmit = async (formData: ChangePassword) => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implement password change API call
      console.log('Changing password:', formData);
      showSuccessToast('Пароль успішно змінено');
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Помилка зміни пароля');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="form-container">
        <div className="container-responsive">
          <div className="card relative !shadow-none">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="form-title">Зміна пароля</h2>
            {error && <FormError message={error} onClose={() => setError(null)} />}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="current_password" className="form-label">
                  Поточний пароль
                </label>
                <div className="relative">
                  <input
                    {...register('current_password', {
                      required: "Це поле обов'язкове",
                    })}
                    type="text"
                    id="current_password"
                    className="input-field"
                  />
                </div>
                {errors.current_password && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="new_password" className="form-label">
                  Новий пароль
                </label>
                <div className="relative">
                  <input
                    {...register('new_password', {
                      required: "Це поле обов'язкове",
                      minLength: {
                        value: 6,
                        message: 'Пароль повинен містити мінімум 6 символів',
                      },
                      pattern: {
                        value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                        message: 'Пароль повинен містити хоча б одну букву та одну цифру',
                      },
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    id="new_password"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 icon-minimal"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm_password" className="form-label">
                  Підтвердження нового паролю
                </label>
                <div className="relative">
                  <input
                    {...register('confirm_password', {
                      required: "Це поле обов'язкове",
                      validate: (value) =>
                        value === watch('new_password') || 'Паролі не співпадають',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 icon-minimal"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.confirm_password.message}</p>
                )}
              </div>

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Завантаження...' : 'Змінити пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
