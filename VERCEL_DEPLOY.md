# Deploy to Vercel - Quick Guide

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Your code pushed to GitHub

## Step-by-Step Deployment

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up/Login with GitHub

3. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

4. **Configure Project**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Click "Deploy"

5. **Add Environment Variables**
   - After first deployment, go to Project Settings
   - Navigate to "Environment Variables"
   - Add:
     - `GROQ_API_KEY` = `your_groq_api_key_here`
     - `NODE_ENV` = `production`
   - Click "Save"
   - Go to "Deployments" tab
   - Click "..." on latest deployment → "Redeploy"

6. **Done!**
   - Your app is live at `your-project.vercel.app`
   - You can add a custom domain in Project Settings

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? Yes
   - Which scope? (select your account)
   - Link to existing project? No
   - Project name: `dapplooker` (or your choice)
   - Directory: `./`
   - Override settings? No

4. **Add Environment Variables**
   ```bash
   vercel env add GROQ_API_KEY
   # Paste your API key when prompted
   
   vercel env add NODE_ENV
   # Enter: production
   ```

5. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## Project Structure for Vercel

```
Dapplooker/
├── api/
│   └── index.js          # Serverless function entry point
├── vercel.json           # Vercel configuration
├── dist/                 # Built frontend (generated)
└── ... (other files)
```

## How It Works

- **Frontend**: Built React app in `dist/` directory
- **Backend**: Express app runs as serverless function in `api/index.js`
- **Routing**: Vercel routes all requests through the Express app
- **API Routes**: Handled by Express middleware

## Environment Variables

Required:
- `GROQ_API_KEY` - Your Groq API key

Optional:
- `NODE_ENV` - Set to `production`

## Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Verify all dependencies are in `package.json`
- Check Vercel build logs for specific errors

### API Routes Not Working
- Verify `api/index.js` exists
- Check `vercel.json` rewrites configuration
- Ensure environment variables are set

### Frontend Not Loading
- Verify `dist` folder is generated during build
- Check that `outputDirectory` in `vercel.json` is `dist`
- Ensure static files are being served correctly

### Timeout Issues
- Vercel free tier has 10s timeout for Hobby plan
- Upgrade to Pro for 60s timeout (configured in vercel.json)
- Optimize API calls if they take too long

## Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL

## Continuous Deployment

- Vercel automatically deploys on every push to main branch
- Preview deployments are created for pull requests
- You can disable auto-deploy in Project Settings

## Monitoring

- View logs in Vercel dashboard
- Check deployment status
- Monitor function execution times
- Set up alerts for errors

## Cost

- **Hobby (Free)**: Perfect for personal projects
  - Unlimited deployments
  - 100GB bandwidth/month
  - Serverless function execution
  - 10s timeout limit

- **Pro ($20/month)**: For production apps
  - Everything in Hobby
  - 1TB bandwidth/month
  - 60s timeout limit
  - Team collaboration

