#!/bin/bash
set -euo pipefail

# Get PR body from the environment variable set in the workflow
body="$PR_BODY"

# Extract "Generative AI usage" section
gai_section=$(printf '%s\n' "$body" | awk '/### Generative AI usage/{flag=1;next}/###/{flag=0}flag')

# Check if section exists
if [[ -z "$gai_section" ]]; then
  echo "Error: Generative AI usage section not found."
  exit 1
fi

# Count checked checkboxes
checkboxes=$(printf '%s\n' "$gai_section" | grep -c '\- \[x\]' || true)

# Ensure exactly one checkbox is checked
if [[ "$checkboxes" -ne 1 ]]; then
  echo "Error: Exactly one checkbox must be checked. Found: $checkboxes."
  exit 1
fi

echo "Generative AI usage disclosure validated successfully."