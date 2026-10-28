#!/usr/bin/env bash
# Set GitHub Actions secrets from .env.local (requires: gh auth login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if ! command -v gh >/dev/null; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.local"
  exit 1
fi

get_var() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r'
}

URL="$(get_var VITE_SUPABASE_URL)"
KEY="$(get_var VITE_SUPABASE_PUBLISHABLE_KEY)"
GUEST="$(get_var VITE_ALLOW_GUEST_SEND)"
if [[ -z "$URL" || -z "$KEY" ]]; then
  echo "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY required in .env.local"
  exit 1
fi

gh secret set VITE_SUPABASE_URL --body "$URL"
gh secret set VITE_SUPABASE_PUBLISHABLE_KEY --body "$KEY"
gh secret set VITE_ALLOW_GUEST_SEND --body "${GUEST:-false}"
echo "GitHub Actions secrets updated. Re-run Deploy workflow or push to main."
