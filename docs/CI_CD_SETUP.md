# CI/CD Setup Guide for Steward

## 🚀 **Overview**

This guide walks you through setting up a comprehensive CI/CD pipeline for Steward using GitHub Actions and Vercel. The pipeline includes:

- ✅ **Quality Assurance**: TypeScript checking, ESLint, unit tests
- ✅ **Build Verification**: Next.js build validation
- ✅ **Security Scanning**: npm audit and Snyk security checks
- ✅ **Automated Deployment**: Production and preview deployments
- ✅ **PR Previews**: Automatic preview deployments for pull requests

## 📋 **Prerequisites**

1. **GitHub Repository**: Your Steward project must be on GitHub
2. **Vercel Account**: Connected to your GitHub repository
3. **Node.js 18+**: For local development and CI/CD
4. **GitHub Actions**: Enabled on your repository

## 🔧 **Step-by-Step Setup**

### **Step 1: Vercel Configuration**

1. **Connect Vercel to GitHub**:
   - Go to [vercel.com](https://vercel.com)
   - Import your Steward repository
   - Configure build settings:
     - **Framework Preset**: Next.js
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
     - **Install Command**: `npm ci`

2. **Get Vercel Tokens**:
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token with full scope
   - Copy the token (you'll need this for GitHub secrets)

3. **Get Project IDs**:
   - In Vercel Dashboard, go to your project
   - Go to Settings → General
   - Copy the **Project ID**
   - Copy the **Organization ID**

### **Step 2: GitHub Secrets Configuration**

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

#### **Required Secrets**

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_organization_id_here
VERCEL_PROJECT_ID=your_project_id_here

# Optional: Security Scanning
SNYK_TOKEN=your_snyk_token_here  # Optional for security scanning
```

#### **How to Add Secrets**

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact name and value

### **Step 3: Environment Variables**

The CI/CD pipeline uses test environment variables for builds. For production, ensure these are set in Vercel:

#### **Vercel Environment Variables**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
# Required for Production
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_APPLICATION_CREDENTIALS=your_service_account_key_json
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
NODE_ENV=production
```

### **Step 4: Verify Setup**

1. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "feat: add CI/CD pipeline"
   git push origin main
   ```

2. **Check GitHub Actions**:
   - Go to your repository → **Actions** tab
   - You should see the "CI/CD Pipeline" workflow running
   - Monitor the progress of each job

3. **Verify Deployment**:
   - Check Vercel Dashboard for successful deployment
   - Visit your production URL to confirm it's working

## 🔄 **Workflow Triggers**

The CI/CD pipeline runs automatically on:

- **Push to `main` branch**: Full pipeline + production deployment
- **Push to `develop` branch**: Full pipeline (no deployment)
- **Pull Request to `main`**: Full pipeline + preview deployment
- **Manual trigger**: Via GitHub Actions UI

## 📊 **Pipeline Jobs**

### **1. Quality Assurance**
- TypeScript compilation check
- ESLint code quality check
- Unit test execution (all 16 API route tests)
- Test coverage reporting

### **2. Build Verification**
- Next.js build process
- Build artifact verification
- Environment variable validation

### **3. Security Scan**
- npm audit for vulnerabilities
- Snyk security scanning (optional)

### **4. Deployment**
- **Production**: Automatic deployment to Vercel on main branch
- **Preview**: Automatic preview deployment for PRs

## 🛠 **Troubleshooting**

### **Common Issues**

1. **Build Failures**:
   ```bash
   # Check local build
   npm run build
   
   # Check TypeScript
   npx tsc --noEmit
   
   # Check linting
   npm run lint
   ```

2. **Test Failures**:
   ```bash
   # Run tests locally
   npm test
   
   # Check test coverage
   npm run test:coverage
   ```

3. **Deployment Issues**:
   - Verify Vercel tokens are correct
   - Check environment variables in Vercel
   - Ensure repository permissions

4. **Secret Issues**:
   - Verify secret names match exactly
   - Check secret values are correct
   - Ensure secrets are added to the right repository

### **Debug Commands**

```bash
# Test the workflow locally
npm run test:ci

# Check build process
npm run build

# Verify environment setup
echo $NODE_ENV
echo $VERCEL_TOKEN
```

## 📈 **Monitoring & Alerts**

### **GitHub Actions Notifications**

1. **Email Notifications**: Configure in GitHub Settings
2. **Slack Integration**: Use GitHub Apps for Slack
3. **Discord Webhooks**: For team notifications

### **Vercel Monitoring**

1. **Deployment Status**: Monitor in Vercel Dashboard
2. **Performance Metrics**: Use Vercel Analytics
3. **Error Tracking**: Integrate with Sentry or similar

## 🔒 **Security Best Practices**

1. **Secrets Management**:
   - Never commit secrets to code
   - Rotate tokens regularly
   - Use least-privilege access

2. **Environment Separation**:
   - Separate test/production environments
   - Use different API keys per environment
   - Validate environment variables

3. **Access Control**:
   - Limit repository access
   - Use branch protection rules
   - Require PR reviews

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [STEWARD_MASTER_SYSTEM_GUIDE.md](../STEWARD_MASTER_SYSTEM_GUIDE.md)

## 🎯 **Next Steps**

After CI/CD setup, consider:

1. **React Component Tests**: Frontend testing
2. **Integration Tests**: End-to-end workflows
3. **Performance Testing**: Load and stress testing
4. **Monitoring Setup**: Error tracking and analytics

---

**Need Help?** Check the troubleshooting section or refer to the master system guide for detailed architecture information. 