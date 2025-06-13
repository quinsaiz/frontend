import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest } from '../types/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { showSuccessToast } from '../styles/toast';
import type { AxiosError } from 'axios';
import {
  formatPhoneNumber,
  validatePhoneNumber,
  getPhoneErrorMessage,
  usePhoneInput,
} from '../hooks/usePhone';
import { FormError } from '../components/FormError';
import { Helmet } from 'react-helmet-async';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginRequest>({ defaultValues: { phone: '+380' } });

  const { handlePhoneInput, handlePhoneKeyDown, handlePhoneClick } = usePhoneInput((value) => {
    setValue('phone', value, { shouldValidate: true });
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedData = {
        ...data,
        phone: formatPhoneNumber(data.phone),
      };
      await login(formattedData);
      showSuccessToast('Successfully logged in');
      navigate('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Login error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Scientific Papers Search</title>
      </Helmet>
      <div className="form-container">
        <div className="container-responsive">
          <div className="card">
            <h2 className="form-title">Login</h2>
            {error && <FormError message={error} onClose={() => setError(null)} />}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1 group">
                <label htmlFor="phone" className="form-label group-focus-within:text-primary">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    {...register('phone', {
                      required: 'This field is required',
                      validate: {
                        validPhone: (value) => {
                          if (!validatePhoneNumber(value)) {
                            return getPhoneErrorMessage(value) || 'Invalid phone number format';
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

              <div className="space-y-1 group">
                <label htmlFor="password" className="form-label group-focus-within:text-primary">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'This field is required' })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
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

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Loading...' : 'Login'}
                </button>

                <div className="flex flex-col sm:flex-row justify-between text-sm gap-2 sm:gap-0 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="link-primary"
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="link-primary"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
