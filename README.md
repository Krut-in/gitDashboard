# GitHub Contribution Dashboard

A production-ready Next.js application for tracking and visualizing GitHub contributions, repository insights, and activity metrics.

## Features

- 🔐 Secure GitHub OAuth authentication via Auth.js
- 📊 Dashboard with contribution statistics
- 🎨 Modern UI with Tailwind CSS
- 🔒 Protected routes with middleware
- ⚡ Built with Next.js 14 App Router
- 📱 Fully responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Auth.js v5 (NextAuth) with GitHub OAuth
- **Styling**: Tailwind CSS
- **GitHub API**: Octokit
- **Validation**: Zod
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
│   │   └── sign-in/          # Sign-in page
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/ # Auth.js API routes
│   ├── dashboard/             # Protected dashboard pages
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   ├── error.tsx              # Error boundary
│   ├── global-error.tsx       # Global error boundary
│   └── loading.tsx            # Global loading state
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Spinner.tsx
│   └── NavBar.tsx             # Navigation bar
├── lib/
│   ├── auth.ts                # Auth.js configuration
│   ├── types.ts               # TypeScript type definitions
│   ├── errors.ts              # Error handling utilities
│   └── safe-fetch.ts          # Safe fetch wrapper
├── middleware.ts              # Route protection
├── .env.example               # Environment variables template
├── .env.local                 # Your local environment (do not commit)
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
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

# Development server with hot reload
npm run dev
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

This is Part 1 of 3. The foundation includes:

- ✅ Authentication with GitHub OAuth
- ✅ Protected dashboard routes
- ✅ User session management
- ✅ Error handling and loading states
- ✅ Responsive UI components

Part 2 will add:

- Repository listing and search
- Contribution statistics
- API integration with Octokit

Part 3 will add:

- Advanced visualizations
- Detailed analytics
- Export functionality

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
