import { TextHistory, GitHubPullRequest } from '../types';
import { ENDPOINTS } from '../config/endpoints';
import dotenv from 'dotenv';
import { config } from '../config/env';

interface NotionResponse {
  output: string;  // The record ID
}

export class ApiService {
  private static API_ENDPOINT = ENDPOINTS.API_URL;
  private static FORWARD_ENDPOINT = ENDPOINTS.FORWARD_URL;
  private static readonly CHUNK_SIZE = 1900;

  static setApiEndpoint(url: string) {
    this.API_ENDPOINT = url;
  }

  static setForwardEndpoint(url: string) {
    this.FORWARD_ENDPOINT = url;
  }

  static getCurrentApiEndpoint() {
    return this.API_ENDPOINT;
  }

  static getCurrentForwardEndpoint() {
    return this.FORWARD_ENDPOINT;
  }

  private static async makeRequest(path: string, options: RequestInit = {}) {
    const baseUrl = this.API_ENDPOINT.replace(/\/$/, '');
    const url = baseUrl;
    
    console.log('Making request to:', url);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async getHistory(): Promise<TextHistory[]> {
    try {
      return await this.makeRequest('/');
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  private static formatPRToString(pr: GitHubPullRequest): string {
    const mergeDate = new Date(pr.merged_at!).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    return `PR ${pr.number} Title: ${pr.title} | Merged: ${mergeDate} | Body: ${pr.body || 'No description'} | `;
  }

  private static createChangelogChunks(prs: GitHubPullRequest[]): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    prs.forEach(pr => {
      const prString = this.formatPRToString(pr);
      
      // Check if adding this PR would exceed chunk size
      if (currentChunk.length + prString.length > this.CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        // If single PR is too long, split it
        if (prString.length > this.CHUNK_SIZE) {
          const splitParts = prString.match(new RegExp(`.{1,${this.CHUNK_SIZE}}`, 'g')) || [];
          splitParts.forEach(part => chunks.push(part));
        } else {
          currentChunk = prString;
        }
      } else {
        currentChunk += prString;
      }
    });

    // Add the last chunk if it has content
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Final validation to ensure no chunk exceeds limit
    return chunks.map(chunk => 
      chunk.length > this.CHUNK_SIZE ? chunk.substring(0, this.CHUNK_SIZE) : chunk
    );
  }

  private static getAuthHeaders() {
    return {
      'Authorization': `Bearer ${config.integrationAppToken}`,
      'Content-Type': 'application/json'
    };
  }

  static async forwardToEndpoint(entry: TextHistory): Promise<string> {
    try {
      if (!entry.pullRequests || entry.pullRequests.length === 0) {
        throw new Error('No pull requests to process');
      }

      const changelogChunks = this.createChangelogChunks(entry.pullRequests);
      const now = new Date();

      // Transform chunks into Notion blocks, ensuring each chunk is within limits
      const children = changelogChunks.map(chunk => ({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{
            type: "text",
            text: {
              content: chunk.substring(0, 2000) // Extra safety check
            }
          }]
        }
      }));
      
      const payload = {
        children,
        properties: {
          merged_records: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `${entry.pullRequests.length} PRs`
                }
              }
            ]
          },
          raw: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: (changelogChunks[0] || '').substring(0, 2000) // Ensure first chunk is within limits
                }
              }
            ]
          },
          timestamp: {
            title: [
              {
                type: "text",
                text: {
                  content: now.toISOString()
                }
              }
            ]
          }
        }
      };

      const response = await fetch(config.notionApiUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json() as NotionResponse;
      return data.output;
    } catch (error) {
      console.error('Error forwarding to endpoint:', error);
      throw error;
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }
}