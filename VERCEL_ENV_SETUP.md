# 🚀 Vercel Environment Variables Setup

## ⚠️ IMPORTANT: Configure Environment Variables in Vercel

Your Vercel deployment won't work properly without environment variables. Vercel doesn't read your local `.env` file.

## 📋 Required Environment Variables

Go to your Vercel dashboard → Your Project → Settings → Environment Variables

Add these variables:



## 🔧 How to Add Environment Variables:

1. Go to https://vercel.com/dashboard
2. Select your project (File-Upload)
3. Go to "Settings" tab
4. Click "Environment Variables" in the sidebar
5. Add each variable:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://Sagars:crJ2baTjy9X3q0tx@sagar.k5ggw.mongodb.net/ResumeRefreshment?retryWrites=true&w=majority&appName=Sagar`
   - Environment: Production, Preview, Development (select all)
6. Repeat for all variables above

## 🔄 After Adding Environment Variables:

1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. OR push a new commit to trigger redeployment

## 🧪 Testing Your Deployment:

1. **Send Email Test**: https://your-vercel-url.vercel.app/
2. **API Test**: https://your-vercel-url.vercel.app/send-upload-link
3. **Profile Form**: https://your-vercel-url.vercel.app/profile/test-token

## 🔍 Debugging:

- Check Vercel Functions logs in the dashboard
- Verify environment variables are set
- Ensure MongoDB Atlas allows connections from 0.0.0.0/0 (all IPs)

## 🔒 Security Note:

Never commit `.env` files to Git! Your credentials are now secure because:
- `.env` is in `.gitignore`
- Environment variables are set in Vercel dashboard
- MongoDB credentials will be used securely in production
