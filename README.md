

```markdown:internal_use/changelog-project/README.md
# Changelog Project

A tool to fetch GitHub pull requests and generate changelogs in Notion.

## Features

- Fetch merged pull requests from GitHub
- Generate formatted changelogs
- Export changelogs to Notion
- Track processed pull requests
- Preview changelog entries
- Persistent storage of changelog history

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Integration App account with GitHub and Notion connections

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd changelog-project
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
```

3. Set up environment variables:

Create `.env.local` in the root directory for the client:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FORWARD_URL=http://localhost:8081
NEXT_PUBLIC_INTEGRATION_APP_TOKEN=your_token_here
NEXT_PUBLIC_GITHUB_API_URL=https://api.integration.app/connections/github/actions/list-prs/run
NEXT_PUBLIC_NOTION_API_URL=https://api.integration.app/connections/notion/actions/create-data-record/run
```

Create `.env` in the server directory:
```env
NODE_ENV=development
INTEGRATION_APP_TOKEN=your_token_here
GITHUB_API_URL=https://api.integration.app/connections/github/actions/list-prs/run
NOTION_API_URL=https://api.integration.app/connections/notion/actions/create-data-record/run
```

### Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client (in a new terminal):
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Fetch Pull Requests**
   - Click "Fetch GitHub Updates" to get recent merged PRs
   - PRs are automatically filtered to show only those merged in the last 7 days

2. **Preview Changes**
   - Click "Preview Chunks" to see the formatted changelog entries
   - Each PR shows title, author, dates, and description

3. **Forward to Notion**
   - Click "Forward Pull Requests" to send the changelog to Notion
   - A link to the Notion page will appear after successful forwarding

4. **Settings**
   - Click the ⚙️ icon to configure API endpoints
   - Update endpoints if using different URLs or ngrok tunnels

5. **Clear History**
   - Use the 🗑️ button to clear both history and processed PRs list
   - This allows re-processing of previously processed PRs

## Data Storage

The application stores data in two JSON files:
- `data/history.json`: Changelog history
- `data/processed-prs.json`: List of processed PR IDs

## Development

### Project Structure
```
changelog-project/
├── src/
│   ├── components/    # React components
│   ├── services/     # API services
│   ├── config/       # Configuration files
│   └── types/        # TypeScript definitions
├── server/
│   ├── src/          # Server source code
│   └── data/         # JSON storage files
└── public/           # Static assets
```

### Environment Variables

See `.env.example` for all required environment variables.

## Troubleshooting

- If PRs aren't showing up, check the GitHub API token permissions
- For Notion errors, verify the database structure matches expected format
- Check server logs for detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your License Here]
```


This README:
1. Provides clear setup instructions
2. Documents all features
3. Explains the environment configuration
4. Includes troubleshooting tips
5. Shows the project structure
6. Includes development guidelines

Let me know if you'd like to add or modify any sections!
