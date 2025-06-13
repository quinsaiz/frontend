import { searchService } from './api';
import type { SearchParams, ScrapingSession } from '../types/search';

export const sessionService = {
  async checkSession(sessionId: number): Promise<ScrapingSession> {
    try {
      const session = await searchService.getSessionDetails(sessionId);
      return session;
    } catch (error) {
      throw error;
    }
  },

  async loadSession(
    sessionId: number,
    onUpdateSearchParams: (params: SearchParams) => void,
    onUpdateSearchQuery: (query: string) => void,
    onFetchResults: (sessionId: number, page: number) => Promise<void>
  ): Promise<ScrapingSession> {
    try {
      const session = await searchService.getSessionDetails(sessionId);

      onUpdateSearchParams({
        query: session.query,
        year_from: session.year_from,
        year_to: session.year_to,
        limit: session.limit,
        fields_of_study: session.fields_of_study,
        publication_types: session.publication_types,
        min_citation_count: session.min_citation_count,
        open_access_only: session.open_access_only,
      });

      onUpdateSearchQuery(session.query);
      await onFetchResults(sessionId, 1);

      return session;
    } catch (error) {
      throw error;
    }
  },

  async exportSession(sessionId: number, format: 'csv' | 'excel' | 'authors-csv'): Promise<void> {
    try {
      const blob = await searchService.exportResults(sessionId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${sessionId}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw error;
    }
  },
};
