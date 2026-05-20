#!/bin/bash

# ==============================================================================
# T2S PRODUCTION DEPLOYMENT SCRIPT
# ==============================================================================
# This script automates the build and deployment process to Google Cloud Run.
# Usage: ./deploy-prod.sh
# ==============================================================================

set -e

# --- 1. Load Local Environment Variables ---
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ Error: .env.local file not found!"
  echo "Please create it first based on .env.example"
  exit 1
fi

# --- 2. Configuration ---
LOCATION="us-central1"
SERVICE_NAME="t2s-service"
PROJECT_ID=$(gcloud config get-value project)

echo "🚀 Starting deployment for project: $PROJECT_ID"
echo "📍 Location: $LOCATION"
echo "📦 Service: $SERVICE_NAME"

# --- 3. Run Cloud Build ---
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=\
_NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL",\
_NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY",\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID",\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",\
_NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID",\
_GOOGLE_GENAI_USE_VERTEXAI="$GOOGLE_GENAI_USE_VERTEXAI",\
_LOCATION="$LOCATION",\
_SERVICE_NAME="$SERVICE_NAME"

echo "✅ Build & Deploy triggered successfully!"
echo "🔗 Check your service at: https://console.cloud.google.com/run/detail/$LOCATION/$SERVICE_NAME/revisions"
