import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import type { FilterOptions, SearchParams, Paper } from '../types/search';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { searchService } from '../services/api';
import { ApiError } from '../services/api';
import { PreviousSessions } from '../components/PreviousSessions';
import { sessionService } from '../services/sessionService';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasResults, setHasResults] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Paper[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const isSearchingRef = useRef(false);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    year_from: undefined,
    year_to: undefined,
    limit: 100,
    fields_of_study: [],
    publication_types: [],
    min_citation_count: undefined,
    open_access_only: false,
  });

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isPreviousSessionsOpen, setIsPreviousSessionsOpen] = useState(false);

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        if (isMounted) {
          await fetchFilterOptions();
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const data = await searchService.getFilterOptions();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const handleInputChange = (
    field: keyof SearchParams,
    value: string | number | boolean | string[] | undefined
  ) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleMultiSelectChange = (
    field: 'fields_of_study' | 'publication_types',
    value: string
  ) => {
    setSearchParams((prev) => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [field]: newValues,
      };
    });
  };

  const handleSearch = async () => {
    try {
      const words = searchParams.query.trim().split(/\s+/);
      if (words.length < 3) {
        setError('Please enter at least 3 words for search');
        return;
      }

      console.log('Starting search with params:', searchParams);
      setIsLoading(true);
      setIsSearching(true);
      isSearchingRef.current = true;
      console.log('Search state after setting:', { isLoading: true, isSearching: true });
      setShowAdvancedFilters(false);
      setError(null);
      setResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setLastCheck(null);
      setHasResults(false);
      setSessionId(null);

      const response = await searchService.startSearch(searchParams);
      console.log('Search response:', response);
      setSessionId(response.session_id);
      setSearchQuery(searchParams.query);

      console.log('Starting polling with state:', { isSearching: true });
      pollForResults(response.task_id, response.session_id);
    } catch (error: unknown) {
      console.error('Search error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setIsLoading(false);
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  };

  const handleStopSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsLoading(false);
    setIsSearching(false);
    isSearchingRef.current = false;
  };

  const pollForResults = async (taskId: string, sessionId: number) => {
    if (!isSearchingRef.current) {
      console.log('Search was stopped, stopping polling');
      return;
    }

    try {
      console.log('Polling for results, taskId:', taskId, 'sessionId:', sessionId);
      const response = await searchService.checkDataReady(
        taskId,
        sessionId,
        lastCheck || undefined
      );
      console.log('Poll response:', response);
      setLastCheck(response.current_time);

      if (response.data_ready || response.task_completed || response.ready_for_download) {
        console.log('Data is ready, fetching results');
        await fetchResults(sessionId);
        setHasResults(true);
        setIsLoading(false);
        setIsSearching(false);
        isSearchingRef.current = false;
      } else if (response.task_status?.status === 'FAILURE') {
        console.log('Task failed');
        setError('Error getting results');
        setIsLoading(false);
        setIsSearching(false);
        isSearchingRef.current = false;
      } else if (
        response.task_status?.status === 'RUNNING' ||
        response.task_status?.status === 'PENDING' ||
        response.should_continue_polling
      ) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
          if (isSearchingRef.current) {
            pollForResults(taskId, sessionId);
          }
        }, 5000);
      } else {
        console.log('Unknown task status');
        setError('Unknown task status');
        setIsLoading(false);
        setIsSearching(false);
        isSearchingRef.current = false;
      }
    } catch (error: unknown) {
      console.error('Polling error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setIsLoading(false);
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  };

  const fetchResults = async (sessionId: number, page: number = 1) => {
    try {
      console.log('Fetching results for session:', sessionId, 'page:', page);
      const response = await searchService.getResults(sessionId, page);
      console.log('Results response:', response);

      if (response.results) {
        setResults(response.results);
        setTotalPages(Math.ceil(response.count / response.page_size));
        setCurrentPage(page);
        setHasResults(true);
        setSessionId(sessionId);
      } else {
        setResults([]);
        setHasResults(true);
        setError('No results found');
      }
    } catch (error: unknown) {
      console.error('Error fetching results:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setHasResults(true);
    }
  };

  const handlePageChange = (page: number) => {
    if (sessionId) {
      fetchResults(sessionId, page);
    }
  };

  const handleExport = async (type: 'csv' | 'excel' | 'authors') => {
    if (!sessionId) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const format = type === 'authors' ? 'authors-csv' : type;
      const blob = await searchService.exportResults(sessionId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results.${type === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setExportError(error.message);
      } else {
        setExportError('An unknown error occurred');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchParams({
      query: '',
      year_from: undefined,
      year_to: undefined,
      limit: 100,
      fields_of_study: [],
      publication_types: [],
      min_citation_count: undefined,
      open_access_only: false,
    });
    setResults([]);
    setHasResults(false);
    setSearchQuery('');
    setError('');
    setSessionId(null);
  };

  const iconAnimations = [
    { x: 0, y: [-10, 10, -10], rotate: [0, 2, -2], duration: 6 },
    { x: [-5, 5, -5], y: [0, -15, 0], rotate: [0, -3, 0], duration: 7 },
    { x: [0, -3, 0], y: [-8, 8, -8], rotate: [0, 1, -1], duration: 5.5 },
    { x: [5, -5, 5], y: [0, 12, 0], rotate: [0, -2, 0], duration: 6.5 },
    { x: [-3, 3, -3], y: [-10, 10, -10], rotate: [0, 3, -3], duration: 6 },
    { x: [0, 5, 0], y: [8, -8, 8], rotate: [0, -1, 1], duration: 5 },
    { x: [-5, 5, -5], y: [0, 10, 0], rotate: [0, 2, 0], duration: 6 },
    { x: [5, -5, 5], y: [0, -10, 0], rotate: [0, 1, -1], duration: 7 },
  ];

  const icons = [
    { src: '/book-icon.svg', alt: 'Book', left: '22%', top: '45%' },
    { src: '/graduate-icon.svg', alt: 'Graduation Cap', left: '70%', top: '42%' },
    { src: '/micro-icon.svg', alt: 'Micro', left: '62%', top: '58%' },
    { src: '/lab-icon.svg', alt: 'Lab', left: '73%', top: '77%' },
    { src: '/explore-icon.svg', alt: 'Explore', left: '41%', top: '50%' },
    { src: '/folder-icon.svg', alt: 'Folder', left: '50%', top: '70%' },
    { src: '/draw-icon.svg', alt: 'Atom', left: '28%', top: '65%' },
    { src: '/science-icon.svg', alt: 'Science', left: '34%', top: '85%' },
  ];

  const handleLoadSession = async (sessionId: number) => {
    try {
      await sessionService.loadSession(sessionId, setSearchParams, setSearchQuery, fetchResults);
      setSessionId(sessionId);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }
    }
  };

  const handleExportSession = async (sessionId: number) => {
    try {
      await sessionService.exportSession(sessionId, 'csv');
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Search for Scientific Papers</title>
      </Helmet>
      <div className="min-h-screen relative overflow-hidden bg-surface-light dark:bg-background-dark">
        <AnimatePresence>
          {!hasResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 pointer-events-none select-none"
            >
              {icons.map((icon, index) => (
                <motion.div
                  key={index}
                  animate={{
                    x: iconAnimations[index].x,
                    y: iconAnimations[index].y,
                    rotate: iconAnimations[index].rotate,
                  }}
                  transition={{
                    duration: iconAnimations[index].duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute w-12 h-12 md:w-16 md:h-16 hover:scale-110 hover:opacity-80 transition-transform duration-200"
                  style={{ left: icon.left, top: icon.top }}
                >
                  <img
                    src={icon.src}
                    alt={icon.alt}
                    className="w-full h-full dark:invert"
                    draggable="false"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 container mx-auto px-4 pt-20">
          <div className="sticky z-50 flex justify-end">
            <button onClick={() => setIsPreviousSessionsOpen(true)} className="btn-filter">
              <ClockIcon className="w-5 h-5" />
              Previous Sessions
            </button>
          </div>

          <motion.div
            animate={{
              y: hasResults ? -40 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="pt-12 md:pt-20"
          >
            <motion.h1
              animate={{
                opacity: hasResults ? 0 : 1,
                y: hasResults ? -20 : 0,
              }}
              transition={{
                duration: 0.3,
              }}
              className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mt-6 mb-8"
            >
              Search for Scientific Papers
            </motion.h1>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) => handleInputChange('query', e.target.value)}
                  placeholder="Enter keywords for search..."
                  className="input-field w-full px-5 py-3 pl-12 pr-32 rounded-full shadow-neomorphic-light dark:shadow-neomorphic-dark border border-gray-200 dark:border-gray-700 focus:border-primary dark:focus:border-primary-dark"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
                {isSearching ? (
                  <button
                    onClick={handleStopSearch}
                    className="btn-search bg-red-500 hover:bg-red-600"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchParams.query.trim()}
                    className="btn-search"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center">
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="filter-icon" />
                  <input
                    type="number"
                    value={searchParams.year_from || ''}
                    onChange={(e) =>
                      handleInputChange('year_from', parseInt(e.target.value) || undefined)
                    }
                    placeholder="From Year"
                    min="1900"
                    max="2099"
                    className="filter-input w-28"
                  />
                  <span className="text-gray-900">-</span>
                  <input
                    type="number"
                    value={searchParams.year_to || ''}
                    onChange={(e) =>
                      handleInputChange('year_to', parseInt(e.target.value) || undefined)
                    }
                    placeholder="To Year"
                    min="1900"
                    max="2099"
                    className="filter-input w-28"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="filter-icon" />
                  <select
                    value={searchParams.limit}
                    onChange={(e) => handleInputChange('limit', parseInt(e.target.value))}
                    className="filter-select"
                  >
                    <option value={10}>10 results</option>
                    <option value={25}>25 results</option>
                    <option value={50}>50 results</option>
                    <option value={100}>100 results</option>
                    <option value={200}>200 results</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="btn-filter"
                >
                  <AdjustmentsHorizontalIcon className="filter-icon" />
                  Advanced
                  <span
                    className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </span>
                </button>

                <button onClick={resetFilters} className="btn-filter">
                  Reset
                </button>
              </div>

              <AnimatePresence mode="wait">
                {showAdvancedFilters && filterOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: 'easeInOut',
                    }}
                    className="overflow-hidden"
                  >
                    <div className="filter-container">
                      <div>
                        <label className="filter-label">Fields of Study</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-background-dark">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                            {filterOptions.fields_of_study.map((field) => (
                              <label key={field} className="flex items-center space-x-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={searchParams.fields_of_study.includes(field)}
                                  onChange={() => handleMultiSelectChange('fields_of_study', field)}
                                  className="filter-checkbox"
                                />
                                <span className="filter-checkbox-label truncate">{field}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="filter-label">Publication Types</label>
                          <div className="space-y-1">
                            {filterOptions.publication_types.map((type) => (
                              <label key={type} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={searchParams.publication_types.includes(type)}
                                  onChange={() =>
                                    handleMultiSelectChange('publication_types', type)
                                  }
                                  className="filter-checkbox"
                                />
                                <span className="filter-checkbox-label">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="filter-label">Minimum Citations</label>
                            <input
                              type="number"
                              value={searchParams.min_citation_count || ''}
                              onChange={(e) =>
                                handleInputChange(
                                  'min_citation_count',
                                  parseInt(e.target.value) || undefined
                                )
                              }
                              placeholder="e.g., 10"
                              min="0"
                              className="filter-input dark:bg-background-dark"
                            />
                          </div>

                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={searchParams.open_access_only}
                                onChange={(e) =>
                                  handleInputChange('open_access_only', e.target.checked)
                                }
                                className="filter-checkbox"
                              />
                              <span className="filter-checkbox-label font-medium">
                                Only Open Access
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-center"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>

          {isLoading && (
            <div className="mt-8 text-center">
              <p className="text-xl text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}

          <AnimatePresence>
            {hasResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-8"
              >
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Search Results
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Found {results.length} results for "{searchQuery}"
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {sessionId && results.length > 0 && (
                      <>
                        <button
                          onClick={() => handleExport('csv')}
                          disabled={isExporting}
                          className="btn-export"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          CSV
                        </button>
                        <button
                          onClick={() => handleExport('excel')}
                          disabled={isExporting}
                          className="btn-export"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Excel
                        </button>
                        <button
                          onClick={() => handleExport('authors')}
                          disabled={isExporting}
                          className="btn-export"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Authors
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {exportError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {exportError}
                  </div>
                )}

                {results.length > 0 ? (
                  <div className="space-y-4 w-full pb-6">
                    {results.map((paper) => (
                      <div key={paper.id} className="paper-card">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h3 className="paper-title flex-1">{paper.title}</h3>
                            {paper.is_open_access && (
                              <span className="status-badge status-completed">Open Access</span>
                            )}
                          </div>
                          <div className="paper-meta">
                            <p>Year: {paper.publication_year || 'Not Specified'}</p>
                            <p>Citations: {paper.citation_count || 0}</p>
                            <p>
                              Authors:{' '}
                              {paper.authors && paper.authors.length > 0
                                ? paper.authors
                                    .map((author) => author.name || author)
                                    .filter(Boolean)
                                    .join(', ') || 'Not Specified'
                                : 'Not Specified'}
                            </p>
                            {paper.fields_of_study && paper.fields_of_study.length > 0 && (
                              <p>Fields: {paper.fields_of_study.join(', ')}</p>
                            )}
                            {paper.publication_types && paper.publication_types.length > 0 && (
                              <p>Publication Types: {paper.publication_types.join(', ')}</p>
                            )}
                            {paper.venue && <p>Publication: {paper.venue}</p>}
                            {paper.doi && <p>DOI: {paper.doi}</p>}
                          </div>
                          <div className="paper-abstract">
                            {paper.abstract || 'Abstract not available'}
                          </div>
                          <div className="paper-actions">
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Paper
                            </a>
                            {paper.pdf_url && (
                              <a
                                href={paper.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Download PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No results found for your query.
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      Try changing search parameters.
                    </p>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <nav className="inline-flex rounded-md shadow">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PreviousSessions
          isOpen={isPreviousSessionsOpen}
          onClose={() => setIsPreviousSessionsOpen(false)}
          onLoadSession={handleLoadSession}
          onExportSession={handleExportSession}
        />
      </div>
    </>
  );
};

export default Dashboard;
