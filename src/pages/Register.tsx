import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { RegistrationRequest, RegistrationVerificationRequest } from '../types/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
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
}

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationAttempts, setVerificationAttempts] = useState(3);
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegistrationRequest>({ defaultValues: { phone: '+380' } });

  const verificationForm = useForm<VerificationForm>();

  const { handlePhoneInput, handlePhoneKeyDown, handlePhoneClick } = usePhoneInput((value) => {
    setValue('phone', value, { shouldValidate: true });
  });

  const onSubmitRegistration = async (data: RegistrationRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedData = {
        ...data,
        phone: formatPhoneNumber(data.phone),
      };
      setPhoneNumber(formattedData.phone);
      await register(formattedData);
      setIsVerificationSent(true);
      verificationForm.reset({ code: '' });
      showSuccessToast('Код підтвердження відправлено');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Помилка реєстрації');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitVerification = async (data: VerificationForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const verificationData: RegistrationVerificationRequest = {
        phone: phoneNumber,
        code: data.code,
      };
      await register(verificationData);
      showSuccessToast('Реєстрація успішна');
      navigate('/dashboard');
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
          showErrorToast('Вичерпано всі спроби. Спробуйте зареєструватися знову.');
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
          <h2 className="form-title">Реєстрація</h2>
          {error && <FormError message={error} onClose={() => setError(null)} />}
          {!isVerificationSent ? (
            <form onSubmit={handleSubmit(onSubmitRegistration)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="phone" className="form-label">
                  Номер телефону
                </label>
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
                {errors.phone && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="first_name" className="form-label">
                  Ім'я
                </label>
                <input
                  {...registerField('first_name', {
                    required: "Це поле обов'язкове",
                  })}
                  type="text"
                  id="first_name"
                  className="input-field"
                />
                {errors.first_name && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="last_name" className="form-label">
                  Прізвище
                </label>
                <input
                  {...registerField('last_name', {
                    required: "Це поле обов'язкове",
                  })}
                  type="text"
                  id="last_name"
                  className="input-field"
                />
                {errors.last_name && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.last_name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    {...registerField('password', {
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
                    id="password"
                    name="password"
                    className="input-field"
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
                {errors.password && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm_password" className="form-label">
                  Підтвердження паролю
                </label>
                <div className="relative">
                  <input
                    {...registerField('confirm_password', {
                      required: "Це поле обов'язкове",
                      validate: (value) => value === watch('password') || 'Паролі не співпадають',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    name="confirm_password"
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
                  {isLoading ? 'Завантаження...' : 'Зареєструватися'}
                </button>
                <div className="text-center mt-4">
                  <Link to="/login" className="link-primary">
                    Вже маєте акаунт? Увійти
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <form
              onSubmit={verificationForm.handleSubmit(onSubmitVerification)}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label htmlFor="code" className="form-label">
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

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Завантаження...' : 'Підтвердити'}
                </button>
                <div className="text-center mt-4">
                  <button onClick={() => navigate('/login')} className="link-primary">
                    Повернутись до авторизації
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

export default Register;
