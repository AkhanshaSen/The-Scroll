#!/usr/bin/env bash
# Generate SEND_EMAIL_HOOK_SECRET and print set / redeploy commands.
# Does not write the secret to any file in the repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF_FILE="$ROOT/supabase/.project-ref"

RAND="$(openssl rand -base64 32 | tr -d '\n')"
SECRET="v1,whsec_${RAND}"

REF="YOUR_REF"
if [[ -f "$REF_FILE" ]]; then
  REF="$(tr -d '[:space:]' < "$REF_FILE")"
fi

echo "Generated SEND_EMAIL_HOOK_SECRET (copy once; not saved to disk):"
echo ""
echo "  $SECRET"
echo ""
echo "Auth and the Edge Function must use the SAME value."
echo "config push reads SEND_EMAIL_HOOK_SECRET from your shell, not from Edge secrets."
echo ""
echo "1) Set Edge Function secret:"
echo ""
echo "  npx supabase secrets set SEND_EMAIL_HOOK_SECRET='$SECRET' --project-ref \"$REF\""
echo ""
echo "2) Export the same secret, then push Auth config (required):"
echo ""
echo "  export SEND_EMAIL_HOOK_SECRET='$SECRET'"
echo "  npx supabase config push --project-ref \"$REF\" --yes"
echo ""
echo "3) Redeploy auth-email (JWT verification off is required for this hook):"
echo ""
echo "  npm run supabase:deploy-auth-email"
echo ""
echo "Also set ALLOW_GUEST_SEND=false for a personal desk if not already:"
echo ""
echo "  npx supabase secrets set ALLOW_GUEST_SEND=false --project-ref \"$REF\""
echo ""
