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
      showSuccessToast('Verification code sent');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Password reset request error');
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
      showSuccessToast('Password successfully changed');
      navigate('/login');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Verification code error');
      }

      setVerificationAttempts((prev) => {
        const newAttempts = prev - 1;
        if (newAttempts <= 0) {
          showErrorToast('All attempts exhausted. Please try resetting your password again.');
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
          <h2 className="form-title">Reset Password</h2>
          {error && <FormError message={error} onClose={() => setError(null)} />}
          {!isVerificationSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1 group">
                <label htmlFor="phone" className="form-label group-focus-within:text-primary">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    {...registerField('phone', {
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

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Loading...' : 'Send Code'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => navigate('/login')} className="link-primary">
                    Return to Login
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
                  Verification Code
                </label>
                <input
                  {...verificationForm.register('code', {
                    required: 'This field is required',
                  })}
                  type="text"
                  id="code"
                  className="input-field"
                  placeholder="Enter verification code"
                />
                {verificationForm.formState.errors.code && (
                  <p className="mt-0.5 text-sm text-red-400">
                    {verificationForm.formState.errors.code.message}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Remaining attempts: {verificationAttempts}
                </p>
              </div>

              <div className="space-y-1 group">
                <label
                  htmlFor="new_password"
                  className="form-label group-focus-within:text-primary"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...verificationForm.register('new_password', {
                      required: 'This field is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters long',
                      },
                      pattern: {
                        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
                        message: 'Password must contain only Latin letters and numbers',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="new_password"
                    className="input-field"
                    placeholder="Enter new password"
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
                  {isLoading ? 'Loading...' : 'Change Password'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => navigate('/login')} className="link-primary">
                    Return to Login
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
