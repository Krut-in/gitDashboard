# 🚀 Vercel Deployment Guide

This guide will help you deploy your GitHub Dashboard application to Vercel.

## ✅ Pre-Deployment Checklist

All critical bugs and type errors have been fixed:
- ✅ Fixed TypeScript type errors in repository route
- ✅ Fixed Contributor type mismatch in ContributorsTable
- ✅ Added `trustHost: true` for NextAuth v5 compatibility
- ✅ Updated environment variable documentation
- ✅ Build passes successfully

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub OAuth App**: Create at [github.com/settings/developers](https://github.com/settings/developers)
3. **Environment Variables Ready**: Have your secrets prepared

## 🔧 Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Your App Name (e.g., "Git Dashboard")
   - **Homepage URL**: `https://your-app-name.vercel.app` (temporary, update after deployment)
   - **Authorization callback URL**: `https://your-app-name.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. Note down your **Client ID**
6. Generate a new **Client Secret** and save it securely

## 🚀 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Add Environment Variables**:
   Click "Environment Variables" and add these **3 VARIABLES ONLY**:

   ```
   GITHUB_CLIENT_ID=<paste_your_github_client_id>
   GITHUB_CLIENT_SECRET=<paste_your_github_client_secret>
   AUTH_SECRET=<paste_output_from_openssl_command>
   ```

   **IMPORTANT Notes**:
   - ✅ **DO ADD**: The 3 variables above
   - ❌ **DO NOT ADD**: `NEXTAUTH_URL` (Vercel sets this automatically to your deployment URL)
   - ❌ **DO NOT ADD**: `NEXTAUTH_SECRET` (we use `AUTH_SECRET` for NextAuth v5)
   
   **To generate `AUTH_SECRET`**, run this command locally:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the value for `AUTH_SECRET`

5. **Deploy**: Click "Deploy" and wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add GITHUB_CLIENT_ID
   vercel env add GITHUB_CLIENT_SECRET
   vercel env add AUTH_SECRET
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## 🔄 Step 3: Update GitHub OAuth App

After your first deployment, you'll get a Vercel URL (e.g., `https://your-app-name.vercel.app`):

1. Go back to your [GitHub OAuth App settings](https://github.com/settings/developers)
2. Update the **Homepage URL** to your Vercel URL
3. Update the **Authorization callback URL** to:
   ```
   https://your-app-name.vercel.app/api/auth/callback/github
   ```
4. Save changes

## ✨ Step 4: Verify Deployment

1. Visit your Vercel URL
2. Click "Sign in with GitHub"
3. Authorize the application
4. You should be redirected to the dashboard
5. Test repository analysis functionality

## 🔐 Environment Variables Reference

**Add to Vercel Dashboard** (Required - Only these 3):

| Variable | Description | Add to Vercel? | Example |
|----------|-------------|----------------|---------|
| `GITHUB_CLIENT_ID` | OAuth App Client ID | ✅ **YES** | `Iv1.a1b2c3d4e5f6g7h8` |
| `GITHUB_CLIENT_SECRET` | OAuth App Client Secret | ✅ **YES** | `ghp_a1b2c3d4...` |
| `AUTH_SECRET` | Secret for JWT signing | ✅ **YES** | Generate: `openssl rand -base64 32` |

**DO NOT Add to Vercel** (Handled automatically):

| Variable | Why Not? |
|----------|----------|
| `NEXTAUTH_URL` | ❌ Vercel automatically sets this to your deployment URL |
| `VERCEL_URL` | ❌ Vercel provides this automatically |
| `NEXTAUTH_SECRET` | ❌ Use `AUTH_SECRET` instead (NextAuth v5 standard) |

**For Local Development Only** (add to `.env` file, not Vercel):
- `NEXTAUTH_URL=http://localhost:3000`

## 🐛 Troubleshooting

### Issue: "Authentication Error"
- **Solution**: Verify environment variables are set correctly in Vercel
- Check that the callback URL in GitHub OAuth settings matches your Vercel URL

### Issue: "Missing GITHUB_CLIENT_ID"
- **Solution**: Ensure all environment variables are added in Vercel dashboard
- Redeploy after adding variables: `vercel --prod`

### Issue: "Rate Limit Exceeded"
- **Solution**: GitHub API rate limits apply. Wait or implement token rotation
- Consider upgrading to GitHub Enterprise for higher limits

### Issue: Build Fails
- **Solution**: Check build logs in Vercel dashboard
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version compatibility

### Issue: "NEXTAUTH_URL_INTERNAL should be explicitly set"
- **Solution**: This is expected on Vercel and can be safely ignored
- Vercel handles this automatically

## 📊 Performance Optimization

Your app is already optimized for Vercel with:
- ✅ Static page pre-rendering where possible
- ✅ Dynamic API routes
- ✅ Edge-compatible middleware
- ✅ Automatic image optimization
- ✅ Route caching

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to your GitHub repository:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Build your application
2. Run tests (if configured)
3. Deploy to production
4. Update your live URL

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update GitHub OAuth callback URL to use custom domain

## 📈 Monitoring

Monitor your application in the Vercel dashboard:
- **Analytics**: View page views and performance
- **Logs**: Check runtime logs and errors
- **Speed Insights**: Analyze Core Web Vitals
- **Usage**: Track bandwidth and function executions

## 🎉 Success!

Your GitHub Dashboard is now live on Vercel! Share the URL with your team and start analyzing repositories.

## 📞 Support

If you encounter issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [NextAuth.js Documentation](https://authjs.dev)
- Review [GitHub API Documentation](https://docs.github.com/en/rest)

---

**Last Updated**: October 26, 2025
**Build Status**: ✅ Passing
**Deployment Ready**: Yes
