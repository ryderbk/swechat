# SweeTalk Workspace

## Overview

pnpm workspace monorepo using TypeScript. SweeTalk is a private couples chat app built with React + TypeScript + Tailwind + Firebase.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend/DB**: Firebase (Firestore, Auth, Storage, FCM)
- **UI components**: shadcn/ui

## Key Commands

- `PORT=23153 BASE_PATH=/sweetalk/ pnpm --filter @workspace/sweetalk run dev` — run SweeTalk locally
- `PORT=23153 BASE_PATH=/sweetalk/ pnpm --filter @workspace/sweetalk run build` — build for production

## SweeTalk Features

### Core (pre-existing)
- Email/password login with remember-me
- Real-time chat with text, images, voice messages
- Message reactions, edit, delete
- Shared note (collaborative)
- Typing indicator, presence/online status
- Read receipts, message delivery status
- Photo album page
- Dark/light theme toggle
- Sound notifications
- Conversation prompts sidebar

### Features Added (v2)
1. **Video & File Sharing** — Upload videos (max 100MB) and documents (.pdf/.doc/.xls/.zip) with progress bar
2. **Quote/Reply** — Swipe right to reply; shows quoted message preview; tap to jump to original
3. **Star/Bookmark** — Long-press to star messages; dedicated /starred page; ⭐ header button
4. **Message Search** — Slide-down search bar with text highlighting, match count, up/down navigation
5. **URL Preview Cards** — Auto-detects URLs, fetches og:title/image via allorigins.win, renders link card
6. **Text Formatting** — *bold*, _italic_, ~strikethrough~, `monospace`; formatting toolbar on input focus
7. **Expanded Reactions + Double-Tap** — 6 quick emojis + full emoji picker; double-tap for ❤️ with float animation
8. **WebRTC Voice/Video Calls** — Full peer-to-peer calls via Firebase signaling; incoming call screen, PiP video, call timer, end-call message
9. **Push Notifications (FCM)** — FCM token registration, foreground toast, background service worker, mute controls
10. **Favicon Badge** — Red circle badge on favicon showing unread count
11. **AES Encryption** — PBKDF2 key derivation + AES-GCM-256 encryption for messages (lib/crypto.ts)
12. **PIN Lock** — 4-digit PIN with SHA-256 hashing; shake on wrong PIN; 30s lockout after 3 attempts; auto-lock after 5min
13. **Biometric Auth** — WebAuthn (Face ID / fingerprint) via PublicKeyCredential; registration + authentication
14. **Chat Themes** — 10 color themes (Rose, Midnight, Ocean, Forest, Sunset, Candy, Galaxy, Minimal, Gold, Deep Rose)
15. **Wallpapers** — 8 gradient presets + custom image upload for chat background
16. **Chat Settings Panel** — Theme, wallpaper, bubble color, bubble shape, font size, nickname, read receipts, last seen, mute
17. **Pin Messages** — Up to 3 pinned messages shown in collapsible banner below shared note
18. **Shared Media Tabs** — Album page now has Photos / Links / Files tabs
19. **PWA** — manifest.json, service worker with cache-first strategy, offline queue via IndexedDB
20. **Updated Firestore Rules** — pinnedMessages, calls, userPreferences, FCM tokens, appConfig collections secured

## File Structure (sweetalk artifact)

```
artifacts/sweetalk/src/
├── App.tsx                        (routes: /, /chat, /album, /starred, /setup-pin)
├── pages/
│   ├── Chat.tsx                   (all features wired in)
│   ├── Login.tsx                  (email/password login)
│   ├── Album.tsx                  (3 tabs: photos, links, files)
│   ├── Starred.tsx                (NEW: starred messages)
│   └── SetupPin.tsx               (NEW: PIN setup wizard)
├── components/
│   ├── MessageBubble.tsx          (video, doc, reply, star, format, double-tap, reactions)
│   ├── EmojiPicker.tsx            (supports custom trigger)
│   ├── VoiceRecorder.tsx
│   ├── SharedNote.tsx
│   ├── TypingIndicator.tsx
│   ├── CallManager.tsx            (NEW: WebRTC call UI)
│   ├── PinLock.tsx                (NEW: PIN/biometric lock overlay)
│   ├── ChatSettings.tsx           (NEW: settings panel)
│   ├── ThemeSelector.tsx          (NEW: 10 theme swatches)
│   └── WallpaperSelector.tsx      (NEW: wallpaper picker)
├── lib/
│   ├── firebase.ts                (+ FCM)
│   ├── firestore.ts               (updated Message type + all new helpers)
│   ├── storage.ts                 (+ uploadVideo, uploadDocument)
│   ├── webrtc.ts                  (NEW: WebRTC signaling)
│   ├── crypto.ts                  (NEW: AES-GCM encryption)
│   ├── biometric.ts               (NEW: WebAuthn)
│   ├── themes.ts                  (NEW: 10 theme definitions)
│   ├── faviconBadge.ts            (NEW: canvas favicon badge)
│   ├── offlineQueue.ts            (NEW: IndexedDB message queue)
│   └── formatText.tsx             (NEW: text formatting parser)
├── hooks/
│   ├── useTheme.ts                (updated: color themes)
│   └── usePinLock.ts              (NEW: PIN state + SHA-256)
└── contexts/
    └── AuthContext.tsx            (+ FCM token + foreground notifications)
```
