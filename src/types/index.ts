// src/types/index.ts

export interface TextSection {
    content: string;
    index: number;
  }
  
  export interface ProcessedText {
    sections: TextSection[];
    originalLength: number;
    sectionCount: number;
  }
  
  export interface GitHubUser {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    url: string;
    html_url: string;
    // Add other user fields as needed
  }
  
  export interface GitHubPullRequest {
    url: string;
    id: number;
    node_id: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    issue_url: string;
    number: number;
    state: string;
    locked: boolean;
    title: string;
    user: GitHubUser;
    body: string | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
    merge_commit_sha: string | null;
    assignee: GitHubUser | null;
    assignees: GitHubUser[];
    requested_reviewers: GitHubUser[];
    requested_teams: any[];
    labels: any[];
    milestone: any | null;
    draft: boolean;
    commits_url: string;
    review_comments_url: string;
    review_comment_url: string;
    comments_url: string;
    statuses_url: string;
    author_association: string;
    auto_merge: any | null;
    active_lock_reason: string | null;
  }
  
  export interface TextHistory {
    id: string;
    content: string;
    timestamp: string;
    sections: number;
    pullRequests?: GitHubPullRequest[];
  }
  
  export interface ApiResponse {
    success: boolean;
    message: string;
    data?: TextHistory;
  }