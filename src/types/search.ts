export interface FilterOptions {
  fields_of_study: string[];
  publication_types: string[];
  year_range: {
    min: number;
    max: number;
  };
  limit_range: {
    min: number;
    max: number;
  };
}

export interface SearchParams {
  query: string;
  year_from?: number;
  year_to?: number;
  limit?: number;
  fields_of_study: string[];
  publication_types: string[];
  min_citation_count?: number;
  open_access_only: boolean;
}

export interface Paper {
  id: number;
  semantic_scholar_id: string;
  title: string;
  abstract: string;
  authors: Array<{ id: number; name: string }>;
  citation_count: number;
  influential_citation_count: number;
  is_open_access: boolean;
  pdf_url?: string;
  publication_year: number;
  reference_count: number;
  scraped_at: string;
  scraping_session: number;
  updated_at: string;
  url: string;
  venue: string;
  doi: string;
  fields_of_study?: string[];
  publication_types?: string[];
}

export interface Author {
  id: string;
  name: string;
  url: string;
  h_index: number;
  paper_count: number;
  citation_count: number;
  affiliations: string[];
}

export type SessionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILURE' | 'PARTIAL_SUCCESS';

export interface ScrapingSession {
  id: number;
  title: string;
  query: string;
  year_from?: number;
  year_to?: number;
  limit?: number;
  fields_of_study: string[];
  publication_types: string[];
  min_citation_count?: number;
  open_access_only: boolean;
  task_id: string;
  status: SessionStatus;
  errors_count: number;
  created_at: string;
  started_at: string;
  completed_at: string;
  profile: number;
  papers_found: number;
  papers_saved: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page_size: number;
}

export interface DataReadyResponse {
  data_ready: boolean;
  total_papers: number;
  recent_papers: number;
  current_time: string;
  has_recent_activity: boolean;
  task_status: {
    status: SessionStatus;
    papers_found: number;
    papers_saved: number;
  };
  should_start_polling: boolean;
  initial_polling_interval: number;
  session_id: number;
  task_completed?: boolean;
  ready_for_download?: boolean;
  should_continue_polling?: boolean;
  message?: string;
  new_papers_count?: number;
  last_check?: string;
  session_info?: any;
}

export interface SearchResponse {
  task_id: string;
  session_id: number;
  parameters: SearchParams;
}
