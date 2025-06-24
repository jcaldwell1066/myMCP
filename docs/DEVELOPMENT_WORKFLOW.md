# Development Workflow Guide

## Overview

myMCP supports **hybrid development workflows** to balance speed with quality. Choose the right approach based on the change complexity and risk level.

## 🎯 **Two Approaches Available**

### 1. **Feature Branches** (Recommended for substantial changes)
- **When to use**: New features, complex changes, experimental work
- **Benefits**: PR reviews, CI/CD validation, isolated development
- **Process**: `feature/branch-name` → PR → code review → merge

### 2. **Trunk-Based Development** (For small, safe changes)  
- **When to use**: Bug fixes, documentation, small improvements
- **Benefits**: Rapid iteration, immediate integration
- **Process**: Direct commits to `main` with automated testing

## 🤔 **Decision Matrix**

| Change Type | Size | Risk Level | Recommended Approach | Why |
|-------------|------|------------|---------------------|-----|
| Bug fixes | Small | Low | Trunk-based | Fast deployment |
| Documentation | Any | Low | Trunk-based | No functional risk |
| New features | Large | High | **Feature branch** | **Needs PR review & CI** |
| UI changes | Medium+ | Medium | **Feature branch** | **Visual review needed** |
| API changes | Any | High | **Feature branch** | **Breaking change risk** |
| Experiments | Any | High | **Feature branch** | **May not be merged** |

## 🚀 **Core Principles**

1. **Quality First**: Use PR workflows for substantial changes
2. **CI/CD Validation**: Every PR runs full test suite  
3. **Code Review**: Complex changes get human review
4. **Rapid Iteration**: Small changes can go direct to main
5. **Feature Toggles**: Use flags for incomplete features
6. **Quick Rollback**: Any commit can be reverted immediately

## 🔄 **Workflows**

### Feature Branch Workflow (Recommended for most changes)

```bash
# 1. Start with latest main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/player-dashboard-improvements

# 3. Develop and test
npm install
npm run build
npm run test

# 4. Make commits as you work
git add .
git commit -m "feat: add bulletproof player dashboard styling"

# 5. Push and create PR
git push origin feature/player-dashboard-improvements
# Create PR via GitHub UI

# 6. Address PR feedback, CI failures
npm run test                           # Fix any test failures
git add . && git commit -m "fix: address PR feedback"
git push

# 7. Merge after approval
```

### Trunk-Based Workflow (For small, safe changes)

```bash
# 1. Morning sync
git pull origin main
npm install && npm run build && npm test

# 2. Make small change
# 3. Test locally
npm run test:unit

# 4. Commit directly to main
git add .
git commit -m "docs: fix typo in README"
git push origin main

# 5. Monitor CI/CD
```

## 🛡️ **Safety Mechanisms**

### 1. Pull Request Workflows (Primary Safety Net) ⭐
- **Full CI/CD validation** on every PR
- **Code review** before merge  
- **Prevents broken code** reaching main
- **Catches issues early** - *Real example: PR workflows caught TypeScript errors and styling issues in the player dashboard before they reached main*
- **TypeScript compilation** checks prevent runtime errors
- **Test coverage** validation ensures quality

### 2. Automated Testing
- **Every push triggers CI/CD**
- **Comprehensive test suite**
- **TypeScript compilation checks**
- **Linting and formatting**

### 2. Feature Toggles
```typescript
// Use feature flags instead of branches
const ENABLE_NEW_DASHBOARD = process.env.FEATURE_NEW_DASHBOARD === 'true';

if (ENABLE_NEW_DASHBOARD) {
  return <NewPlayerDashboard />;
} else {
  return <LegacyDashboard />;
}
```

### 3. Incremental Rollouts
```bash
# Environment-based rollouts
FEATURE_NEW_QUEST=true npm start      # Enable in development
FEATURE_NEW_QUEST=false npm start     # Disable in production
```

## 🧪 **Testing Strategy**

### Pre-Commit (Local)
```bash
npm run lint                          # Code quality
npm run test:unit                     # Fast unit tests
npm run test:integration              # Critical path tests
```

### Post-Commit (CI/CD)
```bash
npm run test:full                     # Complete test suite
npm run test:e2e                      # End-to-end tests
npm run security:scan                 # Security checks
npm run performance:check             # Performance regression
```

## 🚨 **Emergency Procedures**

### Immediate Rollback
```bash
# Revert last commit
git revert HEAD
git push origin main

# Revert to specific commit
git revert <commit-hash>
git push origin main
```

### Hotfix Process
```bash
# 1. Identify the issue
# 2. Create minimal fix
# 3. Test thoroughly
npm run test:critical

# 4. Deploy immediately
git add .
git commit -m "hotfix: resolve critical issue with player data"
git push origin main
```

## 🎯 **Best Practices**

### Commit Guidelines
- **Small commits** (< 200 lines when possible)
- **Clear messages** following conventional commits
- **Working code only** - never break the main branch
- **Test coverage** for all new code

### Code Review
- **Pair programming** for complex changes
- **Post-commit review** via GitHub discussions
- **Collective ownership** - anyone can improve any code

### Communication
- **Slack notifications** for all commits
- **Daily standups** to coordinate changes
- **Immediate alerts** for CI/CD failures

## 🔧 **Tool Configuration**

### Git Configuration
```bash
# Prevent accidental branch creation
git config branch.autosetupmerge false
git config branch.autosetuprebase always

# Always push to main
git config push.default simple
```

### Editor Configuration
```json
// .vscode/settings.json
{
  "git.defaultCloneDirectory": "./main",
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  "git.postCommitCommand": "sync"
}
```

## 📊 **Monitoring**

### Key Metrics
- **Commit frequency**: Target 3-5 commits per developer per day
- **CI/CD success rate**: Target >95%
- **Time to rollback**: Target <5 minutes
- **Test coverage**: Maintain >80%

### Dashboards
- **CI/CD Pipeline Status**: Monitor build health
- **Deployment Frequency**: Track release velocity
- **Error Rates**: Monitor production stability
- **Team Velocity**: Track feature delivery

## 🎓 **Onboarding New Developers**

### Day 1 Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd myMCP

# 2. Set up trunk-based workflow
git config --local branch.main.remote origin
git config --local branch.main.merge refs/heads/main

# 3. Install and test
npm install
npm run build
npm test

# 4. Make first commit
echo "# My Notes" > NOTES.md
git add NOTES.md
git commit -m "docs: add personal notes file"
git push origin main
```

### First Week Goals
- [ ] Make 10+ small commits
- [ ] Fix at least one bug
- [ ] Add one small feature
- [ ] Participate in code review
- [ ] Learn CI/CD pipeline

## 🛠️ **Development Commands**

### Feature Branch Workflow (Recommended)
```bash
# Create new feature branch from latest main
npm run dev:branch feature/my-awesome-feature

# Work on your feature...
npm run dev:status                      # Check status anytime

# When ready, push and create PR
git push origin feature/my-awesome-feature
# Then create PR via GitHub UI - this triggers full CI/CD validation!
```

### Direct-to-Main Workflow (Small changes only)
```bash
# Morning sync
npm run dev:sync                        # Pull, install, build, test

# Make small change, then commit directly
npm run dev:commit "docs: fix typo in README"
```

### Utility Commands
```bash
npm run dev:feature NEW_FEATURE         # Add feature toggle
npm run dev:rollback                    # Emergency rollback  
npm run dev:status                      # Development status
npm run dev:help                        # Show all commands
```

## 🔄 **Hybrid Approach Benefits**

### Why This Works Better
1. **Quality Gates**: Feature branches catch issues before main (proven!)
2. **Speed**: Small changes can skip PR overhead  
3. **Flexibility**: Choose the right tool for the job
4. **Learning**: New developers see both approaches

### Success Stories
- ✅ **PR workflows caught TypeScript compilation errors**
- ✅ **Dashboard styling issues detected before merge**
- ✅ **CI/CD validation prevented broken builds**
- ✅ **Code review improved code quality**

---

## 📚 **Related Documentation**

- [Getting Started](setup/QUICK_SETUP.md) - Basic development setup
- [Testing Guide](packages/engine/docs/TESTING_GUIDE.md) - Comprehensive testing
- [Startup Guide](STARTUP_GUIDE.md) - System startup procedures
- [Contributing](CONTRIBUTING.md) - Code contribution guidelines

**Ready to accelerate your development velocity?** 🚀✨ 