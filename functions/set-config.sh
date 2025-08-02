#!/bin/bash

# Script to set Firebase Functions configuration for local development
# Usage: ./set-config.sh

# Load environment variables from parent directory's .env.local if it exists
if [ -f "../.env.local" ]; then
  export $(cat ../.env.local | grep -v '^#' | xargs)
fi

# Check if required variables are set
if [ -z "$LINE_CHANNEL_ID" ] || [ -z "$LINE_CHANNEL_SECRET" ]; then
  echo "Error: LINE_CHANNEL_ID and LINE_CHANNEL_SECRET must be set in environment or ../.env.local"
  echo "Example:"
  echo "  LINE_CHANNEL_ID=your_channel_id LINE_CHANNEL_SECRET=your_secret ./set-config.sh"
  exit 1
fi

PROJECT_ID="${NEXT_PUBLIC_GCP_PROJECT_ID:-study-schedule-app}"

echo "Setting Firebase Functions config for project: $PROJECT_ID"
echo "LINE Channel ID: $LINE_CHANNEL_ID"

# Set the configuration
firebase functions:config:set \
  line.channel_id="$LINE_CHANNEL_ID" \
  line.channel_secret="$LINE_CHANNEL_SECRET" \
  --project="$PROJECT_ID"

echo "Configuration set successfully!"
echo ""
echo "To view the current configuration, run:"
echo "  firebase functions:config:get --project=$PROJECT_ID"
echo ""
echo "To use these values locally with the emulator, run:"
echo "  firebase functions:config:get --project=$PROJECT_ID > .runtimeconfig.json"