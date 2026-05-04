# SweeTalk — Private Two-Person Chat App

## Overview
A private, intimate chat web app built exclusively for two people. Uses Firebase for all backend functionality (Auth, Firestore, Storage).

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Firebase (Firestore for messages, Auth for login, Storage for images/voice)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Font**: Poppins (Google Fonts)
- **Routing**: Wouter

## Architecture
This is a **frontend-only** app — no Express server is used. Firebase handles everything:
- Authentication via Firebase Auth (email/password)
- Real-time messages via Firestore `onSnapshot` listeners
- File uploads (images, voice) via Firebase Storage

## Key Files
- `src/lib/firebase.ts` — Firebase initialization
- `src/lib/firestore.ts` — All Firestore operations (messages, notes, presence, typing)
- `src/lib/storage.ts` — Firebase Storage upload helpers
- `src/contexts/AuthContext.tsx` — Firebase auth state provider
- `src/hooks/useAuth.ts` — Auth context hook
- `src/hooks/usePartnerUid.ts` — Detects partner's UID from userPresence collection
- `src/hooks/useTheme.ts` — Dark/light mode with localStorage persistence
- `src/hooks/useSound.ts` — Web Audio API chime for new messages
- `src/pages/Login.tsx` — Email/password login page
- `src/pages/Chat.tsx` — Main real-time chat interface
- `src/pages/Album.tsx` — Shared photo album grid
- `src/components/MessageBubble.tsx` — Message with status, reactions, edit/delete
- `src/components/EmojiPicker.tsx` — Custom emoji picker (no external library)
- `src/components/SharedNote.tsx` — Shared pinned note, auto-saved
- `src/components/TypingIndicator.tsx` — Animated typing indicator
- `src/components/VoiceRecorder.tsx` — MediaRecorder API voice messages

## Firestore Data Structure
```
messages/{id}       — chat messages (text, image, voice)
sharedNote/main     — shared pinned note between both users
typingStatus/{uid}  — real-time typing indicator
userPresence/{uid}  — online status + last seen
```

## Environment Variables (Secrets)
All Firebase config values are stored as Replit secrets with `VITE_` prefix:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Firebase Setup (for new users)
1. Create a Firebase project at console.firebase.google.com
2. Enable Email/Password authentication in Auth → Sign-in method
3. Create two user accounts in Auth → Users
4. Enable Firestore Database (start in production mode)
5. Enable Storage
6. Deploy `firestore.rules` and `storage.rules` using `firebase deploy --only firestore:rules,storage`

## Security
- Firestore rules: only authenticated users can read/write
- Each user can only edit/delete their own messages
- Typing status: each user can only write their own doc
- User presence: each user can only write their own doc

## Deployment (Firebase Hosting)
```bash
pnpm --filter @workspace/sweetalk run build
firebase deploy
```

## Theme
- **Light mode**: Warm rose/blush/cream palette — soft and romantic
- **Dark mode**: Deep navy/charcoal — rich and cozy
- Both modes use the Poppins font and rounded, intimate design language
