# T2S - Text to Speech Platform

A modern, high-quality AI voice synthesis platform built with Next.js, Firebase, and Gemini TTS.

## 🚀 Deployment Guide (Production)

This project is optimized for deployment on **Google Cloud Run** using **Cloud Build**.

### 1. Prerequisites
- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
- A Google Cloud Project with Billing enabled.
- Docker and Cloud Run APIs enabled in your project.

### 2. Environment Setup
Create a `.env.local` file based on `.env.example` and fill in all the required variables:
- **Firebase Keys:** Get from your Firebase Project Settings.
- **DOKU Credentials:** Get from your DOKU Dashboard.
- **App URL:** Your production domain (e.g., `https://app.yourdomain.com`).

### 3. Automated Deployment
We have provided a script to make deployment effortless. It will automatically read your `.env.local` and trigger the build.

```bash
# Give execution permission (first time only)
chmod +x deploy-prod.sh

# Run the deployment script
./deploy-prod.sh
```

### 4. Production Secrets (Mandatory)
For security, sensitive keys like `DOKU_SECRET_KEY` and `GEMINI_API_KEY` should be stored in **Secret Manager** instead of plain environment variables.

After your first deployment, run these commands:

```bash
# Add secrets to Secret Manager
echo -n "YOUR_DOKU_SECRET" | gcloud secrets create DOKU_SECRET_KEY --data-file=-
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Mount secrets to Cloud Run
gcloud run services update t2s-service \
  --region=us-central1 \
  --set-secrets="DOKU_SECRET_KEY=DOKU_SECRET_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

## 🛠 Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Runtime:** Node.js (via Bun for builds)
- **Database/Auth:** Firebase
- **AI Model:** Gemini-3.1-Flash-TTS
- **Payments:** DOKU Checkout V2
- **Deployment:** Docker + Google Cloud Run

## 📄 License
MIT
