import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { IntegrationAppClient } from '@integration-app/sdk';
import { Storage } from './utils/storage';
import { GitHubPR, HistoryEntry } from './types';

dotenv.config();

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

// Remove the static token
const INTEGRATION_APP_TOKEN = process.env.INTEGRATION_APP_TOKEN;

if (!INTEGRATION_APP_TOKEN) {
  throw new Error('INTEGRATION_APP_TOKEN is not defined');
}

// Initialize Integration App Client with token from env
const integrationApp = new IntegrationAppClient({
  fetchToken: async () => INTEGRATION_APP_TOKEN
});

function filterMergedPRs(prs: GitHubPR[]): GitHubPR[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return prs.filter(pr => {
    if (!pr.merged_at) return false;
    const mergedDate = new Date(pr.merged_at);
    return mergedDate > sevenDaysAgo;
  });
}

async function fetchPullRequests(): Promise<GitHubPR[]> {
  try {
    console.log('Attempting to fetch pull requests...');
    
    // Make the request to Integration App
    const response = await fetch(process.env.GITHUB_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTEGRATION_APP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Update the input parameters according to the API requirements
        input: {
          owner: "integration-app",
          repo: "core",
          state: "closed",
          sort: "updated",
          direction: "desc",
          per_page: 100
        }
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Integration API error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw response data:', JSON.stringify(data, null, 2));

    if (!data.output?.data) {
      throw new Error('Invalid response format from Integration API');
    }

    const pullRequests = data.output.data;
    console.log('Found pull requests:', pullRequests.length);
    
    const filteredPRs = filterMergedPRs(pullRequests);
    console.log('Filtered PRs count:', filteredPRs.length);
    
    return filteredPRs;
  } catch (error) {
    console.error('Detailed error in fetchPullRequests:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Get history
app.get('/', (_req: Request, res: Response) => {
  const history = Storage.getHistory();
  res.json(history);
});

// Fetch new PRs and add to history
app.post('/', async (_req: Request, res: Response) => {
  try {
    console.log('Received POST request to fetch PRs');
    const pullRequests = await fetchPullRequests();
    
    // Filter out already processed PRs
    const newPRs = pullRequests.filter(pr => !Storage.isPRProcessed(pr.id));
    
    console.log('New PRs count:', newPRs.length);

    if (newPRs.length === 0) {
      console.log('No new PRs found');
      return res.json({ 
        success: true,
        message: 'No new PRs to process',
        count: 0 
      });
    }

    // Add to history
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      pullRequests: newPRs,
      sections: newPRs.length
    };

    // Get current history and add new entry
    const history = Storage.getHistory();
    history.unshift(newEntry);
    
    // Keep only last 50 entries
    const trimmedHistory = history.slice(0, 50);
    
    // Save updated history
    Storage.saveHistory(trimmedHistory);
    
    // Mark PRs as processed
    Storage.addProcessedPRs(newPRs);

    res.json({ 
      success: true, 
      count: newPRs.length,
      message: `Successfully fetched ${newPRs.length} new pull requests`
    });
  } catch (error) {
    console.error('Detailed error in POST handler:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add new endpoint to clear history
app.delete('/', (_req: Request, res: Response) => {
  try {
    Storage.clearHistory();
    res.json({ success: true, message: 'History cleared successfully' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Add error handler middleware
app.use((err: Error, req: Request, res: Response, _next: any) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Using static token for authentication');
}); 