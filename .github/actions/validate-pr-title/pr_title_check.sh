#!/bin/bash
set -euo pipefail

# Keep untrusted PR metadata from injecting extra log lines.
SAFE_PR_AUTHOR=${PR_AUTHOR//$'\r'/}
SAFE_PR_AUTHOR=${SAFE_PR_AUTHOR//$'\n'/ }
SAFE_PR_TITLE=${PR_TITLE//$'\r'/}
SAFE_PR_TITLE=${SAFE_PR_TITLE//$'\n'/ }

# List of authors to skip
SKIP_AUTHORS=("renovate[bot]" "renovate-bot" "dependabot[bot]")

for author in "${SKIP_AUTHORS[@]}"; do
  if [[ "$PR_AUTHOR" == "$author" ]]; then
    printf 'PR authored by %s, skipping validation.\n' "$SAFE_PR_AUTHOR"
    exit 0
  fi
done

printf 'Validating PR title: "%s"\n' "$SAFE_PR_TITLE"

REGEX='^\[?(WIP|wip)?\]?[[:space:]]*(DEMRUM-[0-9]+(,[[:space:]]?DEMRUM-[0-9]+)*|NO-TICKET):[[:space:]].+$'

if [[ "$PR_TITLE" =~ $REGEX ]]; then
  echo "✅ PR title is valid."
else
  echo "❌ PR title is invalid."
  echo ""
  echo "It must match one of the following formats:"
  echo "- DEMRUM-1234: Description"
  echo "- DEMRUM-1234, DEMRUM-5678: Description"
  echo "- NO-TICKET: Description"
  exit 1
fi