export const config = {
  integrationAppToken: process.env.NEXT_PUBLIC_INTEGRATION_APP_TOKEN,
  githubApiUrl: process.env.NEXT_PUBLIC_GITHUB_API_URL || 'https://api.integration.app/connections/github/actions/list-prs/run',
  notionApiUrl: process.env.NEXT_PUBLIC_NOTION_API_URL || 'https://api.integration.app/connections/notion/actions/create-data-record/run',
};

if (!config.integrationAppToken) {
  throw new Error('NEXT_PUBLIC_INTEGRATION_APP_TOKEN is not defined');
} 