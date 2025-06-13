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
      showSuccessToast('Verification code sent');
    } catch (error) {
      const axiosError = error as AxiosError<{ non_field_errors?: string[] }>;
      if (axiosError.response?.data?.non_field_errors) {
        setError(axiosError.response.data.non_field_errors[0]);
      } else {
        setError('Registration error');
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
      showSuccessToast('Registration successful');
      navigate('/dashboard');
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
          showErrorToast('All attempts exhausted. Please try registering again.');
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
          <h2 className="form-title">Registration</h2>
          {error && <FormError message={error} onClose={() => setError(null)} />}
          {!isVerificationSent ? (
            <form onSubmit={handleSubmit(onSubmitRegistration)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
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
                {errors.phone && (
                  <p className="mt-0.5 text-sm text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="first_name" className="form-label">
                  First Name
                </label>
                <input
                  {...registerField('first_name', {
                    required: 'This field is required',
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
                  Last Name
                </label>
                <input
                  {...registerField('last_name', {
                    required: 'This field is required',
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
                  Password
                </label>
                <div className="relative">
                  <input
                    {...registerField('password', {
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
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...registerField('confirm_password', {
                      required: 'This field is required',
                      validate: (value) => value === watch('password') || 'Passwords do not match',
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
                  {isLoading ? 'Loading...' : 'Register'}
                </button>
                <div className="text-center mt-4">
                  <Link to="/login" className="link-primary">
                    Already have an account? Login
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

              <div className="space-y-4 mt-10">
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Loading...' : 'Verify'}
                </button>
                <div className="text-center mt-4">
                  <button onClick={() => navigate('/login')} className="link-primary">
                    Return to login
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
