import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  HomeIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  LockClosedIcon,
  SunIcon,
  MoonIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { ChangePassword } from './ChangePassword';
import { PreviousSessions } from './PreviousSessions';
import { AnimatePresence } from 'framer-motion';
import { searchService } from '../services/api';
import type { ScrapingSession } from '../types/search';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPreviousSessions, setShowPreviousSessions] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<ScrapingSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showChangePassword || showPreviousSessions) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showChangePassword, showPreviousSessions]);

  const fetchPreviousSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const sessions = await searchService.getSessions();
      setPreviousSessions(sessions);
    } catch (err) {
      console.error('Error fetching previous sessions:', err);
      setPreviousSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleChangePasswordClick = () => {
    setShowChangePassword(true);
    setIsMenuOpen(false);
  };

  const handlePreviousSessionsClick = async () => {
    setIsMenuOpen(false);
    if (!showPreviousSessions) {
      await fetchPreviousSessions();
    }
    setShowPreviousSessions(true);
  };

  const handleLoadSession = async (sessionId: number) => {
    try {
      // Тут можна додати логіку завантаження результатів сесії
      console.log('Loading session:', sessionId);
      // Можливо, треба буде передати sessionId в Dashboard або викликати API
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  const handleExportSession = async (sessionId: number) => {
    try {
      // Тут можна додати логіку експорту результатів сесії
      console.log('Exporting session:', sessionId);
    } catch (err) {
      console.error('Error exporting session:', err);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-light dark:bg-surface-dark shadow-neomorphic-light dark:shadow-neomorphic-dark">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex justify-between items-center w-full">
              <button
                onClick={() => navigate('/')}
                className="nav-button"
                aria-label="Go to home page"
              >
                <HomeIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>

              <div className="flex items-center space-x-2">
                {!isAuthenticated ? (
                  <button
                    onClick={toggleTheme}
                    className="nav-button"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePreviousSessionsClick}
                      className="nav-button"
                      aria-label="View previous sessions"
                      disabled={isLoadingSessions}
                    >
                      <ClockIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>

                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`nav-button ${isMenuOpen ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                        aria-expanded={isMenuOpen}
                        aria-label="Open user menu"
                      >
                        <UserIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface-light dark:bg-surface-dark rounded-xl shadow-neomorphic-light dark:shadow-neomorphic-dark py-1 z-50 overflow-hidden">
                          <button
                            onClick={() => {
                              toggleTheme();
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            {theme === 'dark' ? (
                              <SunIcon className="mr-2 h-5 w-5" />
                            ) : (
                              <MoonIcon className="mr-2 h-5 w-5" />
                            )}
                            Змінити тему
                          </button>
                          <button
                            onClick={handleChangePasswordClick}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <LockClosedIcon className="mr-2 h-5 w-5" />
                            Змінити пароль
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <ArrowRightStartOnRectangleIcon className="mr-2 h-5 w-5" />
                            Вийти
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showPreviousSessions && (
          <PreviousSessions
            isOpen={showPreviousSessions}
            onClose={() => setShowPreviousSessions(false)}
            sessions={previousSessions}
            onLoadSession={handleLoadSession}
            onExportSession={handleExportSession}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
