# GitHub Contribution Dashboard

A production-ready Next.js application for tracking and visualizing GitHub contributions, repository insights, and activity metrics with powerful contribution analysis.

## Features

- 🔐 Secure GitHub OAuth authentication via Auth.js
- 📊 Dashboard with contribution statistics
- 🔍 Repository and branch analysis
- 📈 Detailed contributor metrics and analytics
- 💾 CSV and text export of analysis data
- 🎨 Modern UI with Tailwind CSS
- 🔒 Protected routes with middleware
- ⚡ Built with Next.js 14 App Router
- 📱 Fully responsive design
- 🧪 Comprehensive unit tests

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Auth.js v5 (NextAuth) with GitHub OAuth
- **Styling**: Tailwind CSS
- **GitHub API**: Octokit REST API
- **Validation**: Zod
- **Testing**: Jest + ts-jest
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm package manager
- GitHub account
- GitHub OAuth App credentials

## Setup Instructions

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

### 2. Clone and Install

```bash
# Clone the repository (or use your existing directory)
cd gitDashboard

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### 3. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:

   ```env
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   NEXTAUTH_SECRET=your_random_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 4. Run the Application

```bash
# Development mode
npm run dev
# or
pnpm dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
# Create production build
npm run build

# Start production server
npm run start
```

## Project Structure

```
gitDashboard/
├── app/
│   ├── (auth)/
│   │   └── sign-in/              # Sign-in page
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/    # Auth.js API routes
│   │   └── github/
│   │       ├── repos/            # Repository list API
│   │       ├── branches/         # Branch list API
│   │       └── analyze/          # Analysis API
│   │           ├── route.ts      # Main analysis endpoint
│   │           └── stream/       # SSE progress stream
│   ├── dashboard/                # Protected dashboard pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── error.tsx                 # Error boundary
│   ├── global-error.tsx          # Global error boundary
│   └── loading.tsx               # Global loading state
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Spinner.tsx
│   └── NavBar.tsx                # Navigation bar
├── lib/
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
