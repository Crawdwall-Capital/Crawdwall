# 🚀 Git Setup Guide - Crawdwall Project

## 🔐 Security First - What's Protected

Your `.gitignore` files are configured to protect sensitive information:

### ✅ Protected (Never Committed)
- **Environment files**: `.env`, `.env.local`, etc.
- **Database files**: `*.db`, `*.sqlite`, `dev.db`
- **Upload directories**: `uploads/` (may contain user files)
- **Node modules**: `node_modules/`
- **Test files**: `test-*.js`, `test-*.ps1`, `debug-*.js`
- **Logs**: `*.log`, `logs/`
- **OS files**: `.DS_Store`, `Thumbs.db`
- **Editor files**: `.vscode/`, `.idea/`

### ✅ Safe to Commit
- **Source code**: All `.js` files in `src/`
- **Configuration**: `package.json`, `package-lock.json`
- **Documentation**: `README.md`, API docs
- **Environment template**: `.env.example`
- **Database schema**: `create-tables.sql`
- **Postman collection**: `Crawdwall_API_Complete.postman_collection.json`

## 🚀 Quick Git Setup

### 1. Initial Setup (if not done)
```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/yourusername/crawdwall.git
```

### 2. Environment Setup
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit with your actual values
# NEVER commit the .env file!
```

### 3. Add Files to Git
```bash
# Add all safe files
git add .

# Check what will be committed
git status

# Commit your changes
git commit -m "feat: complete backend API with PostgreSQL and Postman collection"

# Push to repository
git push -u origin main
```

## 📋 Pre-Commit Checklist

Before committing, verify:

- [ ] `.env` file is NOT in the commit (should be ignored)
- [ ] No database files (`.db`, `.sqlite`) in the commit
- [ ] No `node_modules/` directory in the commit
- [ ] No test files with sensitive data
- [ ] No upload directories with user files
- [ ] `.env.example` is included (template without real values)

## 🔍 Verify Your Commit

```bash
# Check what files will be committed
git status

# See the diff of what's being added
git diff --cached

# List files that would be committed
git ls-files --cached
```

## 🚨 Emergency: If You Accidentally Committed Sensitive Data

### Remove from last commit (if not pushed yet)
```bash
# Remove file from staging
git reset HEAD backend/.env

# Remove from last commit
git commit --amend
```

### Remove from history (if already pushed)
```bash
# Remove file from entire git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push --force --all
```

## 📁 Project Structure for Git

```
Crawdwall/
├── .gitignore                    # ✅ Root level protection
├── GIT_SETUP_GUIDE.md           # ✅ This guide
├── README.md                    # ✅ Project overview
├── backend/
│   ├── .env                     # ❌ IGNORED - Contains secrets
│   ├── .env.example             # ✅ Template without secrets
│   ├── .gitignore               # ✅ Backend specific ignores
│   ├── package.json             # ✅ Dependencies
│   ├── src/                     # ✅ Source code
│   ├── uploads/                 # ❌ IGNORED - User files
│   ├── *.db                     # ❌ IGNORED - Database files
│   ├── test-*.js                # ❌ IGNORED - Test files
│   └── Crawdwall_API_Complete.postman_collection.json  # ✅ API docs
└── frontend/
    └── (future frontend files)
```

## 🔧 Git Configuration

### Set up your identity
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Useful aliases
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
```

## 📝 Commit Message Guidelines

Use conventional commits:

```bash
# Features
git commit -m "feat: add user authentication system"
git commit -m "feat: implement proposal review workflow"

# Bug fixes
git commit -m "fix: resolve database connection issue"
git commit -m "fix: handle invalid JWT tokens properly"

# Documentation
git commit -m "docs: add API documentation and Postman collection"
git commit -m "docs: update environment setup guide"

# Refactoring
git commit -m "refactor: migrate from Prisma to direct PostgreSQL"
git commit -m "refactor: improve error handling middleware"
```

## 🌟 Best Practices

### 1. Regular Commits
- Commit frequently with small, focused changes
- Each commit should represent one logical change

### 2. Meaningful Messages
- Use descriptive commit messages
- Explain what and why, not just what

### 3. Branch Strategy
```bash
# Create feature branches
git checkout -b feature/investor-dashboard
git checkout -b fix/auth-token-expiry
git checkout -b docs/api-documentation
```

### 4. Before Pushing
```bash
# Always check what you're pushing
git log --oneline -5
git diff origin/main..HEAD
```

## 🔒 Security Reminders

1. **Never commit**:
   - Database credentials
   - API keys
   - JWT secrets
   - User uploaded files
   - Local database files

2. **Always use**:
   - Environment variables for secrets
   - `.env.example` for templates
   - Strong `.gitignore` rules

3. **Double-check**:
   - Review files before committing
   - Use `git status` frequently
   - Verify `.env` is ignored

## 📞 Need Help?

### Check what's ignored
```bash
# See what files are ignored
git status --ignored

# Check if a specific file is ignored
git check-ignore backend/.env
```

### Undo changes
```bash
# Unstage files
git reset HEAD <file>

# Discard local changes
git checkout -- <file>

# Reset to last commit
git reset --hard HEAD
```

---

## ✅ You're Ready!

Your repository is now properly configured with:
- ✅ Comprehensive `.gitignore` protection
- ✅ Environment variable security
- ✅ Safe file structure
- ✅ Complete API documentation
- ✅ Development guidelines

**Safe to commit and push!** 🚀

---

*Remember: When in doubt, check `git status` and review what files are being committed before pushing.*