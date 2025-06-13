import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  CalendarIcon,
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  DocumentCheckIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { ScrapingSession } from '../types/search';
import { searchService } from '../services/api';
import { ApiError } from '../services/api';

interface PreviousSessionsProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession?: (sessionId: number) => void;
  onExportSession?: (sessionId: number) => void;
  sessions?: ScrapingSession[];
}

export const PreviousSessions = ({
  isOpen,
  onClose,
  onLoadSession,
  sessions: initialSessions,
}: PreviousSessionsProps) => {
  const [sessions, setSessions] = useState<ScrapingSession[]>(initialSessions || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialSessions) {
        setSessions(initialSessions);
        setIsLoading(false);
      } else {
        fetchSessions();
      }
    }
  }, [isOpen, initialSessions]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await searchService.getSessions();
      setSessions(response);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Сталася невідома помилка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'status-completed';
      case 'FAILURE':
        return 'status-failed';
      case 'PENDING':
        return 'status-pending';
      case 'RUNNING':
        return 'status-pending';
      case 'PARTIAL_SUCCESS':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Завершено';
      case 'FAILURE':
        return 'Помилка';
      case 'PENDING':
        return 'Очікування';
      case 'RUNNING':
        return 'В процесі';
      case 'PARTIAL_SUCCESS':
        return 'Частковий успіх';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAppliedFiltersCount = (session: ScrapingSession) => {
    let count = 0;
    if (session.fields_of_study?.length > 0) count++;
    if (session.publication_types?.length > 0) count++;
    if (session.min_citation_count) count++;
    if (session.open_access_only) count++;
    if (session.year_from || session.year_to) count++;
    return count;
  };

  const handleClose = () => {
    onClose();
  };

  const handleLoadSession = async (sessionId: number) => {
    try {
      if (onLoadSession) {
        await onLoadSession(sessionId);
        handleClose();
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Сталася помилка при відкритті сесії');
      }
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-center">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.2,
          }}
          className="bg-gray-100 dark:bg-background-dark rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-none flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Попередні сесії пошуку
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Немає попередніх сесій пошуку.</p>
          </div>
          <div className="flex-none p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
              >
                Закрити
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.2,
        }}
        className="bg-gray-100 dark:bg-background-dark rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Попередні сесії пошуку
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6">
            <div className="space-y-4">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 break-words line-clamp-2">
                          {session.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                      <span
                        className={`status-badge ${getStatusBadgeClass(session.status)} ml-4 flex-shrink-0`}
                      >
                        {getStatusText(session.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DocumentMagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Знайдено статей:{' '}
                            <span className="font-medium">{session.papers_found}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <DocumentCheckIcon className="w-5 h-5 text-green-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Збережено: <span className="font-medium">{session.papers_saved}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <DocumentArrowDownIcon className="w-5 h-5 text-purple-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ліміт:{' '}
                            <span className="font-medium">{session.limit || 'Не вказано'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FunnelIcon className="w-5 h-5 text-orange-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Застосовано фільтрів:{' '}
                            <span className="font-medium">{getAppliedFiltersCount(session)}</span>
                          </p>
                        </div>
                      </div>

                      {session.year_from && session.year_to && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-indigo-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Роки:{' '}
                            <span className="font-medium">
                              {session.year_from} - {session.year_to}
                            </span>
                          </p>
                        </div>
                      )}

                      {session.errors_count > 0 && (
                        <div className="flex items-center gap-2">
                          <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Помилок: <span className="font-medium">{session.errors_count}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {session.fields_of_study?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {session.fields_of_study.map((field) => (
                            <span
                              key={field}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                      {session.publication_types?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {session.publication_types.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      {onLoadSession && (
                        <button
                          onClick={() => handleLoadSession(session.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-all duration-200"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          Відкрити сесію
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-none p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
            >
              Закрити
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
