# SweeTalk 🐼💕

A private, real-time chat application for couples, featuring games, shared media, and an AI companion named Panda.

## 🚀 Features
- **Real-time Messaging**: Instant delivery and read receipts via Firestore.
- **Panda AI**: A context-aware companion that plays games and chats with you.
- **Social Games**: "This or That", "Truth or Dare", "Memory Quiz", and more.
- **WebRTC Calls**: Voice and video calls with real-time signaling.
- **End-to-End Encryption**: Secure messaging with derived keys and shared salt.
- **Offline Support**: Queue messages while offline; they sync automatically when you're back.

## 📂 Project Structure
```text
/
├── src/
│   ├── components/       # Reusable UI and Game components
│   ├── contexts/         # React Contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core logic (Firebase, Crypto, Panda AI)
│   ├── pages/            # App pages (Chat, Media, Login, etc.)
│   ├── App.tsx           # Main application router
│   ├── index.css         # Global styles & Tailwind directives
│   └── main.tsx          # App entry point
├── public/               # Static assets & Service Workers
├── firestore.rules       # Firestore Security Rules
├── firestore.indexes.json # Firestore Composite Indexes
├── storage.rules         # Firebase Storage Rules
├── firebase.json         # Firebase Configuration
├── package.json          # Project dependencies
└── vite.config.ts        # Vite configuration
```

## ⚙️ Environment Variables
Create a `.env` file in the root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_GROQ_API_KEY=your_groq_api_key
VITE_VAPID_KEY=your_fcm_vapid_key

# Optional Fallbacks
VITE_PARTNER_UID=partner_user_id
VITE_PARTNER_NAME=Partner Name
```

## 🛠️ Setup & Deployment

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run locally**:
   ```bash
   pnpm dev
   ```

3. **Deploy Firestore Indexes**:
   Crucial for the Starred Messages feature.
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Deploy to Firebase/Vercel**:
   ```bash
   pnpm build
   # Follow your preferred deployment flow
   ```

## 🔒 Security
- **Authentication**: Firebase Auth with restricted UIDs in `firestore.rules`.
- **Encryption**: AES-GCM encryption with PBKDF2 key derivation using a persistent shared salt.
