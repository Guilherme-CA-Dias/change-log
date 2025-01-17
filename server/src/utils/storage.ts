import fs from 'fs';
import path from 'path';
import { HistoryEntry, GitHubPR } from '../types/index';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const PROCESSED_PRS_FILE = path.join(DATA_DIR, 'processed-prs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(PROCESSED_PRS_FILE)) {
  fs.writeFileSync(PROCESSED_PRS_FILE, JSON.stringify({}, null, 2));
}

export const Storage = {
  // History methods
  getHistory(): HistoryEntry[] {
    try {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  saveHistory(history: HistoryEntry[]): void {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error saving history:', error);
      throw error;
    }
  },

  clearHistory(): void {
    try {
      // Clear history file
      fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
      
      // Clear processed PRs file
      fs.writeFileSync(PROCESSED_PRS_FILE, JSON.stringify({}, null, 2));
      
      console.log('Successfully cleared both history and processed PRs');
    } catch (error) {
      console.error('Error clearing history and processed PRs:', error);
      throw error;
    }
  },

  // Processed PRs methods
  getProcessedPRs(): Record<string, boolean> {
    try {
      const data = fs.readFileSync(PROCESSED_PRS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading processed PRs:', error);
      return {};
    }
  },

  addProcessedPRs(prs: GitHubPR[]): void {
    try {
      const processed = this.getProcessedPRs();
      prs.forEach(pr => {
        processed[pr.id.toString()] = true;
      });
      fs.writeFileSync(PROCESSED_PRS_FILE, JSON.stringify(processed, null, 2));
    } catch (error) {
      console.error('Error saving processed PRs:', error);
      throw error;
    }
  },

  isPRProcessed(prId: number): boolean {
    const processed = this.getProcessedPRs();
    return !!processed[prId.toString()];
  }
}; 