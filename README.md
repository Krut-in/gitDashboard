# GitHub Contribution Dashboard

Fast, reliable GitHub contribution insights without spreadsheets or manual triage. This Next.js app unifies GitHub API data with local git analysis to surface who owns what, when teams ship, and where the codebase is trending. Get clear visuals for activity and ownership, plus an optional AI Manager Report that turns raw metrics into concise, action-oriented summaries.

## Why this exists (pain points)

- GitHub’s UI and CLI scatter commit info across pages and commands—great for details, hard for trends.
- Attributing ownership is noisy: merge commits, squashed histories, and email aliases skew the story.
- Managers need a narrative (“what changed, who’s stuck, where to improve”) without hand-built reports.

## Our approach

- Combine GitHub data with local git modes for accuracy and speed.
- Aggregate activity into timelines and heatmaps to reveal patterns at a glance.
- Provide an optional AI Manager Report for narrative recommendations and risks.
- Stream progress for large repos and handle rate limits gracefully with caching and backoffs.

## Key features

- GitHub OAuth (NextAuth) and secure token handling
  - `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- Analysis modes via API (`app/api/github/analyze/route.ts`):
  - blame: line-level ownership via `lib/git/blame.ts`
  - commits: activity via `lib/git/commits.ts`
  - github-api: metadata via `lib/github-api-commits.ts`
  - hybrid: combine sources for completeness
  - legacy commit analysis: `lib/analysis.ts`
- Advanced analysis (non-stream and stream):
  - `app/api/github/analyze/advanced/route.ts`
  - `app/api/github/analyze/advanced/stream/route.ts` (SSE + progress updates)
- AI Manager Report (OpenAI) with caching and graceful fallbacks
  - `app/api/ai/manager-report/route.ts`, `lib/openai.ts`
- Exports: CSV/text for contributors, messages, times, and files
- Robust error handling and rate-limit checks in `lib/github.ts` with shared constants

## Visualizations (what you see)

Components live under `components/charts/`:

- Commits timeline (`CommitsTimeline.tsx`), Lines changed timeline (`LinesChangedTimeline.tsx`)
- Net lines bar (`NetLinesBar.tsx`), Add/remove stacked (`AddRemoveStacked.tsx`)
- Activity and contribution heatmaps (`ActivityHeatmap.tsx`, `ContributionHeatmap.tsx`)
- Contribution Gantt (`ContributionGantt.tsx` + `GanttRow.tsx`, `GanttTooltip.tsx`)
- User weekly bar (`UserWeeklyBarChart.tsx`)
- Metric toggle and timeline selector (`MetricToggle.tsx`, `TimelineSelector.tsx`)

Repository and branch dashboards are in `app/dashboard/repo/[owner]/[repo]` and `.../branch/[branch]` with an advanced view for deeper dives.

## How it works (architecture)

- Auth: GitHub OAuth → JWT session with encrypted access token → client session (`lib/auth.ts`).
- Data pipeline: fetch commits (Octokit + `lib/github-api-commits.ts`) → convert (`lib/commit-converter.ts`) → analyze (`lib/analysis.ts`).
- Advanced paths: extract timeline (`lib/git/timeline.ts`), user metrics (`lib/git/user-metrics.ts`), insights (`lib/insights.ts`), and commit message analysis (`lib/commit-message-analysis.ts`).
- Real-time: SSE endpoints stream progress and partial results from `app/api/github/analyze/advanced/stream/route.ts`.
- AI: `POST` analysis payload → OpenAI via `lib/openai.ts` → structured JSON narrative with caching and safe fallbacks.

## Getting started

Prereqs
- Node 18+
- GitHub OAuth App (Client ID/Secret)
- Optional: OpenAI API key for AI Manager Report

Environment variables (`.env.local`)

```env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_secret
AUTH_SECRET=your_random_secret_string
# Optional for AI Manager Report
OPENAI_API_KEY=your_openai_key
```

Install and run

```bash
npm install
npm run dev
```

Then sign in with GitHub and open the dashboard at `/dashboard/analyze`.

## Usage walkthrough

1) Pick repository/branch
- Use the repositories page to select a repo (`app/dashboard/repositories/page.tsx`) and branch picker (`components/BranchSelector.tsx`).

2) Run analysis and watch progress
- Kick off via the dashboard; large repos stream progress via SSE. You’ll see steps and partial metrics in real time.

3) Explore visuals and toggle perspectives
- Switch metrics (lines, net, commits), select time ranges, and use the timeline selector to focus on windows that matter.

4) Generate the AI Manager Report (optional)
- Sends summarized analysis to OpenAI and returns an action-oriented narrative with risks and recommendations. Works only when `OPENAI_API_KEY` is configured; otherwise a graceful fallback message is shown.

5) Export
- Download CSV/text for contributors, commit messages/times, and impacted files.

## Notes and limits

- Rate limits: The GitHub API is respected, with proactive checks and backoff. Large repos may take longer; streaming keeps the UI responsive.
- Local git modes: Some modes use local repos and require a `repoPath` to be available to the server runtime.
- Privacy: OAuth tokens are session-scoped (JWT) and used only for your requests. AI is fully optional and off by default.
- Accuracy: Blame-based ownership avoids merge-commit inflation and honors `.mailmap` and blame-ignore configs where applicable.

## Roadmap and extensibility

- Add PR/Issues metrics and cross-link activity to review throughput.
- Persist results and cache for faster re-runs (self-hosted DB/Redis).
- Enrich AI insights with trend detection and goal tracking.
- More charts and team-rollup views; per-directory ownership breakdowns.

## Scripts and project hints

- Dev: `npm run dev`
- Type-check: `npm run type-check`
- Lint: `npm run lint`
- Test: `npm test` (see `__tests__/` for examples like `analysis.test.ts`, `date.test.ts`)

## License

MIT — see LICENSE.

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

│ ├── auth.ts # Auth.js configuration
│ ├── github.ts # GitHub API client factory
│ ├── analysis.ts # Contribution analysis engine
│ ├── progress.ts # SSE progress emitter
│ ├── date.ts # Date utilities
│ ├── types.ts # TypeScript type definitions
│ ├── errors.ts # Error handling utilities
│ └── safe-fetch.ts # Safe fetch wrapper
├── **tests**/
│ ├── analysis.test.ts # Analysis engine tests
│ └── date.test.ts # Date utilities tests
├── middleware.ts # Route protection
├── .env.example # Environment variables template
├── .env.local # Your local environment (do not commit)
├── jest.config.ts # Jest configuration
├── next.config.mjs # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json # TypeScript configuration
└── package.json # Dependencies and scripts

````

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
````

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
