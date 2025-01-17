'use client';
// src/components/TextProcessor.tsx
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/apiService';
import { TextHistory, GitHubPullRequest } from '../types';

interface HistoryEntryWithNotion extends TextHistory {
  notionId?: string;
}

export default function TextProcessor() {
  const [history, setHistory] = useState<HistoryEntryWithNotion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newApiUrl, setNewApiUrl] = useState('');
  const [newForwardUrl, setNewForwardUrl] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<TextHistory | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forwardingId, setForwardingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setError(null);
      const loadedHistory = await ApiService.getHistory();
      setHistory(loadedHistory);
    } catch (err) {
      setError('Failed to load history. Please check your connection and try again.');
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchGitHub = async () => {
    try {
      setIsFetching(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch(`${ApiService.getCurrentApiEndpoint()}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.message) {
        if (result.success) {
          setSuccessMessage(result.message);
          // Load the updated history immediately after successful fetch
          const loadedHistory = await ApiService.getHistory();
          setHistory(loadedHistory);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('Failed to fetch GitHub updates. Please try again.');
      console.error('Error fetching GitHub updates:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleForward = async (entry: HistoryEntryWithNotion) => {
    try {
      setForwardingId(entry.id); // Set the loading state for this entry
      const notionId = await ApiService.forwardToEndpoint(entry);
      // Update the history entry with the Notion ID
      setHistory(prevHistory => 
        prevHistory.map(item => 
          item.id === entry.id 
            ? { ...item, notionId } 
            : item
        )
      );
    } catch (err) {
      console.error('Error forwarding entry:', err);
      setError('Failed to forward entry to endpoint');
    } finally {
      setForwardingId(null); // Clear the loading state
    }
  };

  const handleUpdateEndpoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (newApiUrl) {
      ApiService.setApiEndpoint(newApiUrl);
    }
    if (newForwardUrl) {
      ApiService.setForwardEndpoint(newForwardUrl);
    }
    setShowSettings(false);
    loadHistory(); // Reload with new endpoint
  };

  const handlePreview = async (entry: TextHistory) => {
    setSelectedEntry(entry);
    setShowPreview(true);
  };

  const handleClearHistory = async () => {
    try {
      await ApiService.clearHistory();
      setHistory([]); // Clear local state
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
    }
  };

  const renderPullRequest = (pr: GitHubPullRequest) => (
    <div key={pr.id} className="border-l-4 border-blue-500 pl-3 mb-2">
      <div className="flex justify-between items-start">
        <a 
          href={pr.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          #{pr.number} {pr.title}
        </a>
        <span className={`text-sm px-2 py-1 rounded ${
          pr.state === 'closed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {pr.state}
        </span>
      </div>
      <div className="text-sm text-gray-600 mt-1">
        <span>Created by {pr.user.login}</span>
        <span className="mx-2">•</span>
        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
        {pr.merged_at && (
          <>
            <span className="mx-2">•</span>
            <span className="text-purple-600">Merged {new Date(pr.merged_at).toLocaleDateString()}</span>
          </>
        )}
      </div>
    </div>
  );

  const formatPRContent = (pr: GitHubPullRequest) => {
    const title = `#${pr.number} ${pr.title}`;
    const body = pr.body || 'No description';
    const author = pr.user.login;
    const date = new Date(pr.created_at).toLocaleDateString();
    const mergedDate = pr.merged_at ? new Date(pr.merged_at).toLocaleDateString() : null;

    return `
Title: ${title}
Author: ${author}
Created: ${date}${mergedDate ? `\nMerged: ${mergedDate}` : ''}

Description:
${body}

-------------------
`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pull Request History</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleFetchGitHub}
            disabled={isFetching}
            className={`bg-green-500 text-white px-4 py-2 rounded-md ${
              isFetching ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
            }`}
          >
            {isFetching ? 'Fetching...' : 'Fetch GitHub Updates'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-blue-500 hover:text-blue-700"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={handleClearHistory}
            className="text-red-500 hover:text-red-700"
          >
            🗑️ Clear History
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Current Endpoints:</h3>
          <div className="text-sm text-gray-600 mb-4">
            <div>API: {ApiService.getCurrentApiEndpoint()}</div>
            <div>Forward: {ApiService.getCurrentForwardEndpoint()}</div>
          </div>
          
          <form onSubmit={handleUpdateEndpoints} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update API Base URL (ngrok URL):
              </label>
              <input
                type="text"
                value={newApiUrl}
                onChange={(e) => setNewApiUrl(e.target.value)}
                placeholder="https://xxxx-xx-xx-xxx-xx.ngrok.io"
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the complete ngrok URL
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Forward Endpoint:
              </label>
              <input
                type="text"
                value={newForwardUrl}
                onChange={(e) => setNewForwardUrl(e.target.value)}
                placeholder="http://localhost:8081"
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the complete endpoint URL
              </p>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Update Endpoints
            </button>
          </form>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="text-gray-500">No history available</p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="text-blue-500 font-medium">
                    {entry.pullRequests?.length || 0} pull requests
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(entry)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
                  >
                    Preview Chunks
                  </button>
                  {entry.notionId ? (
                    <a
                      href={`https://www.notion.so/${entry.notionId.replace(/-/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm hover:bg-green-200 transition-colors flex items-center"
                    >
                      View in Notion →
                    </a>
                  ) : (
                    <button
                      onClick={() => handleForward(entry)}
                      disabled={forwardingId === entry.id}
                      className={`bg-green-500 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center ${
                        forwardingId === entry.id 
                          ? 'opacity-75 cursor-wait' 
                          : 'hover:bg-green-600'
                      }`}
                    >
                      {forwardingId === entry.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Forwarding...
                        </>
                      ) : (
                        'Forward Pull Requests'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Preview Chunked Text</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-8">
              {selectedEntry.pullRequests?.map((pr) => (
                <div key={pr.id} className="border border-gray-700 rounded-lg overflow-hidden bg-[#252526]">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <a 
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-semibold text-lg"
                      >
                        #{pr.number} {pr.title}
                      </a>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        pr.state === 'closed' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
                      }`}>
                        {pr.state}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <span>Author: {pr.user.login}</span>
                      <span className="mx-2">•</span>
                      <span>Created: {new Date(pr.created_at).toLocaleDateString()}</span>
                      {pr.merged_at && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-purple-400">
                            Merged: {new Date(pr.merged_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-[#1e1e1e] p-4 font-mono text-sm">
                    <pre className="text-gray-300 whitespace-pre-wrap break-words">
                      {pr.body || 'No description provided'}
                    </pre>
                  </div>

                  {/* Footer */}
                  <div className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center text-sm">
                    <a 
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400"
                    >
                      View on GitHub →
                    </a>
                    <span className="text-gray-500">
                      PR #{pr.number}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}