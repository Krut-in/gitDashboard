# GitHub Contribution Dashboard

A production-ready Next.js application for comprehensive GitHub contribution analysis. Track contributors, visualize activity patterns, export data, and generate manager-ready reports for any repository branch.

![Dashboard Preview](./docs/screenshots/dashboard.png)
![Analysis Results](./docs/screenshots/analysis.png)

## ✨ Features

### Authentication & Security
- ✅ Secure GitHub OAuth authentication via Auth.js v5
- ✅ Protected routes with middleware
- ✅ JWT-based session management
- ✅ Automatic token refresh

### Repository Analysis
- ✅ List all accessible repositories (public & private)
- ✅ Search and filter repositories by name, visibility, and language
- ✅ View all branches for selected repository
- ✅ Protected branch indicators

### Contribution Analytics
- ✅ **Comprehensive Contributor Metrics**:
  - Commit counts and commit dates
  - Lines added, deleted, and net changes
  - Active days and contribution periods
  - Merge commit tracking
  - Bot filtering capability
  
- ✅ **Smart Deduplication**:
  - GitHub ID-based matching
  - Email-based matching (with normalization)
  - Name-based fallback
  - Handles noreply emails correctly

- ✅ **Date Range Filtering**:
  - Analyze specific time periods
  - Automatic date range detection
  - First and last commit tracking

### Visualizations
- ✅ **Net Lines Bar Chart**: Top contributors by code impact
- ✅ **Add/Remove Stacked Chart**: Addition vs deletion patterns
- ✅ **Commits Over Time**: Activity timeline
- ✅ **Activity Heatmap**: Weekly patterns and hourly distribution
- ✅ Interactive sortable contributor table
- ✅ Inactive contributor highlighting (>30 days)

### Reports & Exports
- ✅ **Manager-Readable Summary**:
  - Executive overview with key metrics
  - Top contributor highlights
  - Inactive developer alerts
  - Code pattern analysis
  - Actionable recommendations
  
- ✅ **CSV Exports**:
  - Contributors with full statistics
  - Commit times and dates
  - Downloadable for Excel/Sheets

- ✅ **Markdown Export**:
  - Complete analysis report
  - Ready for documentation/sharing

### User Experience
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Real-time loading states and progress indicators
- ✅ Error handling with user-friendly messages
- ✅ Breadcrumb navigation
- ✅ Mobile-friendly design

### Developer Experience
- ✅ TypeScript with strict mode
- ✅ Comprehensive unit tests (Jest)
- ✅ Zod schema validation
- ✅ ESLint and code quality checks
- ✅ Modular architecture
- ✅ Extensive inline documentation

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Authentication** | Auth.js v5 (NextAuth) |
| **Styling** | Tailwind CSS |
| **GitHub API** | Octokit REST API v20 |
| **Validation** | Zod v3.22 |
| **Testing** | Jest + ts-jest |
| **Charts** | Chart.js + react-chartjs-2 |
| **Icons** | Lucide React |
| **Date Utils** | date-fns |

## 📋 Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm
- GitHub account
- GitHub OAuth App credentials

## 🚀 Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: GitHub Contribution Dashboard
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Note down your **Client ID**
6. Generate a new **Client Secret** and note it down

### 2. Install Dependencies

```bash
cd gitDashboard
npm install
```

### 3. Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Add your credentials to `.env.local`:

```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Run Tests

```bash
npm test
```

### 6. Build for Production


```bash
npm run build
npm run start
```

## 📁 Project Structure

```
gitDashboard/
├── app/
│   ├── (auth)/
│   │   └── sign-in/              # Sign-in page
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js routes
│   │   └── github/
│   │       ├── repos/            # Repository list API
│   │       ├── branches/         # Branch list API
│   │       └── analyze/          # Analysis API & SSE
│   ├── dashboard/
│   │   ├── repositories/         # Repo selection page
│   │   └── repo/[owner]/[repo]/
│   │       ├── page.tsx          # Branch selection
│   │       └── branch/[branch]/  # Analysis results
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # Reusable UI (Button, Card, Spinner)
│   ├── charts/                   # Chart components
│   │   ├── NetLinesBar.tsx
│   │   ├── AddRemoveStacked.tsx
│   │   ├── CommitsOverTime.tsx
│   │   └── ActivityHeatmap.tsx
│   ├── RepoList.tsx              # Repository selector
│   ├── BranchSelector.tsx        # Branch selector
│   ├── ContributorsTable.tsx     # Sortable table
│   ├── ProgressPanel.tsx         # SSE progress display
│   ├── AnalysisSummary.tsx       # Manager report
│   └── NavBar.tsx
├── lib/
│   ├── auth.ts                   # Auth.js config
│   ├── github.ts                 # GitHub API client
│   ├── analysis.ts               # Core analysis engine
│   ├── date.ts                   # Date utilities
│   ├── format.ts                 # Display formatting
│   ├── progress.ts               # SSE emitter
│   ├── types.ts                  # TypeScript types
│   ├── errors.ts                 # Error handling
│   └── safe-fetch.ts             # Fetch wrapper
├── __tests__/                    # Jest unit tests
├── middleware.ts                 # Route protection
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 API Documentation

### Authentication

All API routes require authentication. Requests must include valid session cookies from Auth.js.

### GET `/api/github/repos`

List accessible repositories for authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 30, max: 100)
- `visibility` (optional): `all`, `public`, or `private`

**Response:**
```json
[
  {
    "id": 123456,
    "name": "my-repo",
    "full_name": "username/my-repo",
    "owner": { "login": "username" },
    "private": false,
    "description": "Project description",
    "language": "TypeScript",
    "stargazers_count": 42,
    "forks_count": 7,
    "updated_at": "2024-01-15T10:30:00Z",
    "html_url": "https://github.com/username/my-repo"
  }
]
```

### GET `/api/github/branches`

List branches for a repository.

**Query Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `page` (optional): Page number
- `per_page` (optional): Results per page

**Response:**
```json
[
  {
    "name": "main",
    "commit": {
      "sha": "abc123...",
      "url": "https://..."
    },
    "protected": true
  }
]
```

### POST `/api/github/analyze`

Run contribution analysis for a branch.

**Request Body:**
```json
{
  "owner": "username",
  "repo": "my-repo",
  "branch": "main",
  "since": "2024-01-01",      // Optional
  "until": "2024-12-31",      // Optional
  "filterBots": true          // Optional (default: true)
}
```

**Response:**
```json
{
  "contributors": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "githubLogin": "johndoe",
      "githubId": 123456,
      "avatarUrl": "https://...",
      "commitCount": 150,
      "additions": 5000,
      "deletions": 1200,
      "netLines": 3800,
      "firstCommitDate": "2024-01-05T...",
      "lastCommitDate": "2024-12-20T...",
      "activeDays": 85,
      "isMergeCommitter": false
    }
  ],
  "commitMessages": [...],
  "commitTimes": [
    {
      "date": "2024-01-15T10:30:00Z",
      "timestamp": 1705318200000,
      "author": "John Doe"
    }
  ],
  "metadata": {
    "totalCommits": 500,
    "analyzedCommits": 485,
    "totalContributors": 12,
    "dateRange": {
      "start": "2024-01-01T...",
      "end": "2024-12-31T..."
    }
  },
  "exports": {
    "contributorsCSV": "name,email,...",
    "commitTimesText": "...",
    ...
  },
  "warnings": []
}
```

## 📊 Usage Guide

### 1. Sign In
Click "Sign in with GitHub" on the homepage.

### 2. Select Repository
Browse or search for a repository in the dashboard.

### 3. Choose Branch
Select the branch you want to analyze.

### 4. Configure Analysis (Optional)
- Set date range (since/until)
- Toggle bot filtering

### 5. Run Analysis
Click "Start Analysis" and wait for results.

### 6. View Results
- Charts: Visual patterns and trends
- Table: Sortable contributor statistics
- Summary: Manager-ready report

### 7. Export Data
- Download Contributors CSV
- Download Commits CSV
- Download Summary Markdown

## ⚠️ Known Limitations

### GitHub API Rate Limits
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour
- Large repositories (>1000 commits) may take time
- The app checks rate limits before analysis

### Performance Considerations
- Analysis time scales with commit count
- Repos with >10,000 commits may timeout
- Consider using date range filters for large repos
- Pagination is automatic but affects performance

### Data Accuracy
- Bot detection is heuristic-based (may have false positives/negatives)
- Contribution stats depend on commit metadata accuracy
- Squash merges may affect individual contribution tracking
- Private emails (`noreply@github.com`) are handled but limit deduplication

### Technical Limitations
- No real-time collaboration (single-user sessions)
- No database (all analysis is on-demand)
- CSV exports are limited to browser memory
- Server-side rendering requires auth cookies

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
4. Update GitHub OAuth App callback URL to production URL
5. Deploy

**Note**: Vercel Edge Runtime has limitations. SSE routes may need serverless functions.

### Docker

```dockerfile
# Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t github-dashboard .
docker run -p 3000:3000 --env-file .env.local github-dashboard
```

### Other Platforms
- **Netlify**: Use Next.js adapter
- **AWS**: Amplify or ECS
- **Self-hosted**: PM2 + nginx reverse proxy

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Test files are in `__tests__/`:
- `date.test.ts`: Date parsing and formatting
- `analysis.test.ts`: Deduplication and aggregation logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run build` to verify
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Auth.js](https://authjs.dev/)
- GitHub API via [Octokit](https://github.com/octokit)
- Charts by [Chart.js](https://www.chartjs.org/)
- Icons by [Lucide](https://lucide.dev/)

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review API documentation above

---

**Built with ❤️ using Next.js 14 and TypeScript**

│   ├── auth.ts                   # Auth.js configuration
│   ├── github.ts                 # GitHub API client factory
│   ├── analysis.ts               # Contribution analysis engine
│   ├── progress.ts               # SSE progress emitter
│   ├── date.ts                   # Date utilities
│   ├── types.ts                  # TypeScript type definitions
│   ├── errors.ts                 # Error handling utilities
│   └── safe-fetch.ts             # Safe fetch wrapper
├── __tests__/
│   ├── analysis.test.ts          # Analysis engine tests
│   └── date.test.ts              # Date utilities tests
├── middleware.ts                 # Route protection
├── .env.example                  # Environment variables template
├── .env.local                    # Your local environment (do not commit)
├── jest.config.ts                # Jest configuration
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit `.env.local`** - This file contains sensitive credentials
2. **NEXTAUTH_SECRET** must be a strong, random string
3. **GitHub tokens** are encrypted in JWT sessions, not stored in a database
4. **Scopes**: The app requests `repo`, `read:user`, and `user:email` scopes
5. **HTTPS required** for production deployments
6. Ensure your GitHub OAuth callback URL matches your deployment URL

## Environment Variables

| Variable               | Description                    | Required |
| ---------------------- | ------------------------------ | -------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App Client ID     | Yes      |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Yes      |
| `NEXTAUTH_SECRET`      | Secret for signing JWT tokens  | Yes      |
| `NEXTAUTH_URL`         | Base URL of your application   | Yes      |

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Development server with hot reload
npm run dev
```

## API Endpoints

### GET /api/github/repos

Returns paginated list of user repositories.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 30, max: 100)
- `sort` (optional): Sort field (default: updated)
- `direction` (optional): Sort direction (default: desc)

**Response:**

```json
{
  "repositories": [...],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /api/github/branches

Returns list of branches for a repository.

**Query Parameters:**

- `owner` (required): Repository owner
- `repo` (required): Repository name
- `page` (optional): Page number
- `per_page` (optional): Items per page

**Response:**

```json
{
  "branches": [
    {
      "name": "main",
      "commit": { "sha": "abc123...", "url": "..." },
      "protected": false
    }
  ],
  "pagination": {...}
}
```

### POST /api/github/analyze

Analyzes contributions for a repository branch.

**Request Body:**

```json
{
  "owner": "username",
  "repo": "repository",
  "branch": "main",
  "includeBots": false
}
```

**Response:**

```json
{
  "contributors": [...],
  "commitMessages": [...],
  "commitTimes": [...],
  "filesByAuthor": [...],
  "merges": [...],
  "warnings": [],
  "metadata": {
    "totalCommits": 1234,
    "analyzedCommits": 1200,
    "totalContributors": 15,
    "dateRange": { "start": "...", "end": "..." }
  },
  "exports": {
    "contributorsCSV": "...",
    "commitMessagesText": "...",
    "commitTimesText": "...",
    "filesByAuthorText": "...",
    "mergesText": "..."
  }
}
```

### GET /api/github/analyze/stream

Server-Sent Events endpoint for real-time analysis progress.

**Query Parameters:**

- `owner` (required): Repository owner
- `repo` (required): Repository name
- `branch` (required): Branch name

**SSE Events:**

```
data: {"type":"progress","percent":50,"message":"Processing...","currentPage":5}
data: {"type":"complete","percent":100,"message":"Analysis complete"}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update GitHub OAuth callback URL to your Vercel domain
5. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Set environment variables in your hosting platform
3. Update GitHub OAuth callback URL
4. Start the server: `npm run start`

## Troubleshooting

### Authentication Issues

- Verify GitHub OAuth App credentials are correct
- Check callback URL matches exactly (including protocol and port)
- Ensure `NEXTAUTH_SECRET` is set and is a strong random string
- Clear browser cookies and try again

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)
- Run `npm run type-check` to identify TypeScript errors

### GitHub API Rate Limiting

- Authenticated requests have a limit of 5,000 requests per hour
- Rate limit resets hourly
- Check headers for rate limit status

## Next Steps

**Part 1 (Complete):** ✅

- Authentication with GitHub OAuth
- Protected dashboard routes
- User session management
- Error handling and loading states
- Responsive UI components

**Part 2 (Complete):** ✅

- Repository listing API
- Branch listing API
- Contribution analysis engine
- Real-time progress streaming
- CSV/text export generation
- Comprehensive unit tests

**Part 3 (Coming):**

- Advanced visualizations
- Detailed analytics UI
- Interactive charts and graphs
- Export functionality in UI
- Repository search and filtering

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
