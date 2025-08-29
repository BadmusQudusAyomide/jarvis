@echo off
echo 🚀 JARVIS WhatsApp Bot Deployment Helper
echo ========================================
echo.

echo 📋 Step 1: Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

echo.
echo 📋 Step 2: Add all files to git
git add .

echo.
echo 📋 Step 3: Commit changes
git commit -m "Update: WhatsApp bot ready for deployment"

echo.
echo 📋 Step 4: Check remote origin
git remote -v

echo.
echo 🎯 Next Steps:
echo 1. Create a GitHub repository
echo 2. Add your GitHub repo as remote: git remote add origin YOUR_REPO_URL
echo 3. Push to GitHub: git push -u origin main
echo 4. Deploy to Render using the DEPLOYMENT.md guide
echo.
echo 📖 Read DEPLOYMENT.md for complete instructions
echo.
pause
