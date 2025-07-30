# 🚨 VERCEL ENVIRONMENT VARIABLES SETUP

## **CRITICAL: Deployment Failing Due to Missing Environment Variables**

Your Vercel deployment is failing because **required environment variables are not configured**. This guide will fix the deployment issue.

## **Required Environment Variables**

### **1. Database Configuration**
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### **2. Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **3. AI Services**
```
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_CLOUD_VISION_API_KEY=your-google-vision-api-key
```

### **4. Application Configuration**
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

## **How to Set Environment Variables on Vercel**

### **Step 1: Access Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your `steward` project
3. Click on **Settings** tab

### **Step 2: Add Environment Variables**
1. Click on **Environment Variables** in the left sidebar
2. Add each variable with the following settings:
   - **Name**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select **Production** (and optionally **Preview**)

### **Step 3: Redeploy**
1. After adding all variables, go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Monitor the deployment logs

## **Environment Variable Sources**

### **From Your Local .env File**
Copy these values from your local `.env` file:
```bash
# Database
DATABASE_URL=your-supabase-database-url

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Google Cloud Vision
GOOGLE_CLOUD_VISION_API_KEY=your-google-vision-api-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## **Verification Steps**

### **1. Check Environment Variables**
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify all required variables are present
- Ensure they are set for **Production** environment

### **2. Test Deployment**
- Trigger a new deployment
- Monitor build logs for environment variable errors
- Check runtime logs for missing variable errors

### **3. Verify Application**
- Test AI agent functionality
- Verify database connections
- Check authentication flow

## **Common Issues**

### **Issue 1: "Environment variable not found"**
**Solution**: Add the missing variable to Vercel environment variables

### **Issue 2: "Database connection failed"**
**Solution**: Verify `DATABASE_URL` is correct and accessible from Vercel

### **Issue 3: "OpenAI API key invalid"**
**Solution**: Check `OPENAI_API_KEY` format and validity

### **Issue 4: "Supabase connection failed"**
**Solution**: Verify Supabase URL and keys are correct

## **Security Notes**

- ✅ **Public Variables**: Only `NEXT_PUBLIC_*` variables are exposed to the browser
- ✅ **Private Variables**: All other variables are server-side only
- ✅ **Encryption**: Vercel encrypts environment variables at rest
- ✅ **Access Control**: Only project members can view/edit variables

## **Next Steps**

1. **Add all required environment variables** to Vercel
2. **Redeploy the application**
3. **Monitor deployment logs** for success
4. **Test the AI agent** functionality
5. **Verify all features** work correctly

---

**After completing this setup, your deployment should succeed and the AI agent should work properly!** 🚀 