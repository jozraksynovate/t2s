# 🎙️ T2S - AI Text-to-Speech Studio

T2S is a beautiful, premium, and state-of-the-art AI-powered Text-to-Speech (TTS) dialogue studio. It allows developers and creators to synthesize voice narrations and multi-speaker dialogues with rich micro-animations, pure Shadcn styling, real-time loading state translations, and enterprise-grade security.

Built on top of **Next.js 15+ (App Router)**, **Tailwind CSS**, **Shadcn/UI**, **Bun**, **Firebase Authentication**, and the unified **Google Gen AI SDK (Gemini)**.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Package Manager**: [Bun](https://bun.sh/) (ultra-fast compilation and execution)
- **Frontend Framework**: Next.js 15+ (App Router, Turbopack)
- **Styling**: Vanilla Tailwind CSS + Tailwind-Merge & Clsx
- **UI Components**: Pure, unmodified [Shadcn UI](https://ui.shadcn.com/) components
- **Authentication**: Firebase Client SDK + Firebase Admin SDK (Server Session Verification)
- **AI Core**: Unified `@google/genai` Client SDK supporting both Google AI Studio and Vertex AI platforms
- **Cryptographic Security**: Pure native hardware-level entropy CSPRNG for UUID generation (`crypto.randomUUID`)

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Bun** (version 1.0 or higher)
- **Node.js** (version 20+ for global crypto support)
- **Google Cloud SDK** (gcloud CLI - only if using Vertex AI mode)

### 2. Installation
Clone the repository and install the dependencies:
```bash
bun install
```

### 3. Environment Setup
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Running the Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Configuration

T2S uses a dual-layered configuration for AI Generation (Gemini) and Client Authentication (Firebase).

### A. Google Gen AI Setup (Choose One Mode)

#### ⚡ Option 1: Fast-Track Developer Mode (Google AI Studio)
Perfect for testing and getting started in **under 30 seconds** with zero Google Cloud credentials or billing required.
1. Visit [Google AI Studio](https://aistudio.google.com/) and create a free API Key.
2. In your `.env.local` file:
   - Comment out or delete `GOOGLE_GENAI_USE_VERTEXAI`.
   - Uncomment `GEMINI_API_KEY` and paste your key:
     ```env
     GEMINI_API_KEY="AIzaSyYourAPIKeyHere"
     ```

#### 🏢 Option 2: Enterprise Production Mode (Google Cloud Vertex AI)
Designed for production-grade security, enterprise compliance, and server-side IAM authorization on **Google Cloud Run**.
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Vertex AI API** in your project.
3. In your `.env.local` file, configure your project details:
   ```env
   GOOGLE_GENAI_USE_VERTEXAI=true
   GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
   GOOGLE_CLOUD_LOCATION="us-central1"
   ```
4. **Local Authentication**: Run the following command in your local terminal to log in using Application Default Credentials (ADC):
   ```bash
   gcloud auth application-default login
   ```
   The Next.js server will automatically fetch these active credentials on your local machine.
5. **Production (Cloud Run) Authentication**: When deployed to Cloud Run, simply assign a service account with the **Vertex AI User** role to the service. No key files, secrets, or manual credentials needed!

---

### B. Firebase Authentication Setup

The studio requires a Firebase project for secure email/password and Google Sign-In authentication.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Under project settings, register a new **Web App** to obtain your client credentials.
3. Populate your `.env.local` with the client credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-app"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
   ```
4. Go to **Authentication** in the Firebase sidebar:
   - Under the **Sign-in method** tab, enable **Email/Password** and **Google**.
5. **CRITICAL STEP for Production Deployments**:
   - Go to Authentication -> Settings -> **Authorized Domains**.
   - Add your Cloud Run production URL (e.g. `https://your-service-hash.run.app`).
   - *Failure to do this will result in the `auth/unauthorized-domain` error during Google Sign-In.*

---

## ⚡ Key Commands

| Command | Action |
| :--- | :--- |
| `bun install` | Installs project dependencies. |
| `bun run dev` | Runs the development server at [http://localhost:3000](http://localhost:3000). |
| `bun run build` | Builds an optimized production-ready bundle. |
| `bun run start` | Boots the compiled Next.js production server locally. |
| `npx shadcn@latest add <component>` | Adds a new official Shadcn component to the codebase. |

---

## 🛡️ Robust Fail-Safe Design & Security

- **Self-Healing Imports**: If you launch the application without setting up Firebase client environment variables, the system catches the initialization error and registers mock fallback services. This prevents fatal blank screen crashes and logs clear step-by-step setup guides in your developer console.
- **Server Guarding**: The server-side API route `/api/generate` verifies client JWT tokens against the Firebase Admin SDK. If admin credentials are not set up, it fails gracefully at request-time with a detailed error instead of causing import-time crashes.
- **HTTPS Specialized UUID**: Eliminates weak, predictable JavaScript `Math.random` generation in favor of modern hardware-level cryptographic random number generation (`crypto.randomUUID`), aligning with Cloud Run secure context requirements.
