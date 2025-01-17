export interface GitHubPR {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  number: number;
  state: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  user: {
    login: string;
    id: number;
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  pullRequests: GitHubPR[];
  sections: number;
} 