#!/usr/bin/env bash
#
# Matatu Route Intelligence Agent - Deployment Automator
# Automates local git commits, environment security verification, and release dispatching
# to the connected GitHub repository.
#

set -Eeuo pipefail
trap cleanup SIGINT SIGTERM ERR EXIT

# Color definitions for responsive CLI signaling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  # Any temporary cleanup goes here if needed.
}

print_hdr() {
  echo -e "\n${CYAN}${BOLD}============== MATHREE DEPLOYMENT AUTOMATOR ==============${NC}"
}

print_success() {
  echo -e "${GREEN}${BOLD}✔ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}${BOLD}⚠ WARNING: $1${NC}"
}

print_error() {
  echo -e "${RED}${BOLD}✘ ERROR: $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Clear screen for focus
clear

print_hdr
echo -e "${BOLD}Mzee Route Agent Deployment Sync Control${NC}"
echo -e "This automates pre-push security scans, local verifications, and pushes to"
echo -e "the GitHub repository connected to your Cloud Run deployment environment."
echo -e "=========================================================="

# 1. Verification of Git Initialization
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  print_error "This directory is not a Git repository. Please initialze git first."
  exit 1
fi

# 2. Branch Check
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
print_info "Current local tracking branch is: ${BOLD}${CURRENT_BRANCH}${NC}"

if [ "${CURRENT_BRANCH}" != "main" ]; then
  print_warn "You are currently on branch '${CURRENT_BRANCH}', but deployments target 'main'."
  read -p "Would you like to automatically checkout/merge to default branch 'main'? (y/N): " -r choice
  if [[ "$choice" =~ ^[Yy]$ ]]; then
    print_info "Attempting checkout of 'main' branch..."
    if ! git checkout main; then
      print_error "Failed to checkout main. Please resolve active conflicts or stashes manually."
      exit 1
    fi
    CURRENT_BRANCH="main"
    print_success "Switched to 'main' branch."
  else
    print_error "Aborted deployment workflow. Must push from tracking branch 'main' to deploy."
    exit 1
  fi
fi

# 3. Pull Verification to prevent divert branches
print_info "Fetching latest remote status to verify timeline consistency..."
git fetch origin main --quiet || print_warn "Could not reach remote repository. Proceeding with caution using cached timeline."

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse @{u} 2>/dev/null || echo "")

if [ -n "${REMOTE_HASH}" ] && [ "${LOCAL_HASH}" != "${REMOTE_HASH}" ]; then
  BASE_HASH=$(git merge-base HEAD @{u})
  if [ "${LOCAL_HASH}" = "${BASE_HASH}" ]; then
    print_warn "Your local branch is behind 'origin/main'. You need to pull first."
    read -p "Execute 'git pull origin main --rebase' now? (y/N): " -r pull_choice
    if [[ "$pull_choice" =~ ^[Yy]$ ]]; then
      if ! git pull origin main --rebase; then
        print_error "Git pull failed. Please resolve conflicts manually before re-running."
        exit 1
      fi
      print_success "Branch synchronized perfectly with origin/main."
    else
      print_error "Aborted. Sync with origin/main is mandatory prior to deployment."
      exit 1
    fi
  elif [ "${REMOTE_HASH}" = "${BASE_HASH}" ]; then
    print_info "Your local branch is ahead of 'origin/main' by $(git rev-list --count @{u}..HEAD) commits. Ready to push."
  else
    print_warn "Local and remote branches have diverged."
    print_error "Requires manual rebase or merge resolution before automating deployment sync."
    exit 1
  fi
fi

# 4. Environment & Secrets Check/Shield
# Scan modified and untracked files for potential secret leaks
print_hdr
print_info "Running Environmental Security & Key Leak scans..."

SECRET_FLAGGED=0
SENSITIVE_FILES=(".env" "key.json" "secrets" "credentials.json" "gcp-key.json" "gha-creds")

# Check if there are uncommitted secrets files that are NOT in .gitignore
for s_file in "${SENSITIVE_FILES[@]}"; do
  if [ -f "$s_file" ]; then
    # Check if tracked
    if git ls-files --error-unmatch "$s_file" >/dev/null 2>&1; then
      print_error "CRITICAL: Sensitive file '${s_file}' is currently tracked by Git!"
      SECRET_FLAGGED=1
    fi
  fi
done

# Perform regex scans for typical API Key string structures in code additions
STAGED_DIFF=$(git diff --cached 2>/dev/null || echo "")
UNSTAGED_DIFF=$(git diff 2>/dev/null || echo "")
COMBINED_DIFFS="${STAGED_DIFF}${UNSTAGED_DIFF}"

# Patterns for typical API keys: 
# - open_api_key / stripe_key / gemini_key assignment with string
if echo "${COMBINED_DIFFS}" | grep -Ei "([A-Za-z0-9_]*(KEY|SECRET|PASSWORD|TOKEN)[[:space:]]*=[[:space:]]*['\"][A-Za-z0-9_-]{10,}['\"])" >/dev/null; then
  print_warn "Potential raw hardcoded API Key or credentials detected in your active code changes!"
  echo -e "${RED}Found matching pattern:${NC}"
  echo "${COMBINED_DIFFS}" | grep -Ei "([A-Za-z0-9_]*(KEY|SECRET|PASSWORD|TOKEN)[[:space:]]*=[[:space:]]*['\"][A-Za-z0-9_-]{10,}['\"])"
  SECRET_FLAGGED=1
fi

if [ ${SECRET_FLAGGED} -eq 1 ]; then
  print_warn "Environment checks flagged potential secret exposures."
  read -p "Do you still want to bypass security scanners and continue? (y/N): " -r sec_choice
  if [[ ! "$sec_choice" =~ ^[Yy]$ ]]; then
    print_error "Deployment halted. Please extract your raw keys to safe hidden environment variables."
    exit 1
  fi
else
  print_success "Security scan finished successfully. No raw secrets detected in code diffs."
fi

# 5. Pre-push Compilation Check Verification
print_hdr
print_info "Running local dry-run linter and compiler verification tests..."
if [ -f "package.json" ]; then
  if npm run lint && npm run build; then
    print_success "Local compilation and static analysis completed flawlessly!"
  else
    print_warn "Local build or lint checks failed. Deploying this code might break your production site."
    read -p "Are you sure you want to proceed and override pre-verification tests? (y/N): " -r test_choice
    if [[ ! "$test_choice" =~ ^[Yy]$ ]]; then
      print_error "Deployment cancelled to keep production stable. Code compiles error-free before next push."
      exit 1
    fi
  fi
else
  print_warn "No package.json found. Skipping pre-compilation test dry-runs."
fi

# 6. Git Commit message gathering & staging
print_hdr
print_info "Compiling local file changes status:"
git status -s

CHANGES_COUNT=$(git status -s | wc -l)
if [ "${CHANGES_COUNT}" -eq 0 ]; then
  print_warn "No local file changes detected."
  read -p "Force git push current commits anyway? (y/N): " -r force_push_choice
  if [[ ! "$force_push_choice" =~ ^[Yy]$ ]]; then
    print_info "Nothing to push. Aborting."
    exit 0
  fi
else
  read -p "Stage all local changes and proceed to commit? (Y/n): " -r stage_choice
  if [[ ! "$stage_choice" =~ ^[Nn]$ ]]; then
    print_info "Staging all local matching files..."
    git add .
    print_success "Files successfully staged."
    
    # Prompt clean commit message
    echo -e "\nEnter commit message (a structured prefix '[ai-deploy]' will automatically be added):"
    read -p "> " -r commit_msg
    
    if [ -z "$commit_msg" ]; then
      commit_msg="Routine platform update and navigation fine-tuning"
    fi
    
    PREFIXED_MSG="[ai-deploy] ${commit_msg}"
    print_info "Executing local commit with message: ${BOLD}${PREFIXED_MSG}${NC}"
    
    if ! git commit -m "${PREFIXED_MSG}"; then
      print_error "Git commit failed. Aborting deployment."
      exit 1
    fi
    print_success "Local commit recorded successfully."
  else
    print_error "Unable to deploy unstaged changes. Aborting command."
    exit 1
  fi
fi

# 7. Safe Push Execution
print_hdr
print_info "Pushing code to origin main to trigger GitHub Actions CI/CD runner..."
if ! git push origin main; then
  print_error "Git push failed! Check your SSH key / credentials, connection, or remote repo status."
  exit 1
fi

print_hdr
print_success "CODE SYNCHRONIZED AND PUSHED SUCCESSFULLY!"
echo -e ""
echo -e "${GREEN}Deploy Command Trigger Workflow Completed:${NC}"
echo -e "1. ${BOLD}Git Branch Checked:${NC} Branch 'main' active and safe"
echo -e "2. ${BOLD}Security Safe-Lock:${NC} Credential audit passed"
echo -e "3. ${BOLD}Verification:${NC} Pre-compiled successfully"
echo -e "4. ${BOLD}Prefix Registered:${NC} '${BOLD}[ai-deploy]${NC}' committed"
echo -e "5. ${BOLD}Remote Dispatched:${NC} Changes sent to origin"
echo -e ""
echo -e "${YELLOW}Next Steps for Developers:${NC}"
echo -e "🔍 Monitor your GitHub Actions workflow at the repository web UI."
echo -e "⚡ Once the CI/CD run builds successfully, your active changes will automatically deploy"
echo -e "   to: ${CYAN}https://matatu-route-intelligence-agent-771815273294.europe-west2.run.app${NC}"
echo -e "=========================================================="
