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

### Features Added (v3 — Games System)
21. **Games Panel** — 🎮 button in header opens left-side GamePanel with 14 games; sidebar auto-hides
22. **Panda AI (Games)** — `lib/panda.ts` uses Groq API for question generation, answer evaluation, reveal comments
23. **Game Firestore** — `lib/gameFirestore.ts`: all game state under `games/{type}/rounds/`, `pandaMemory/main`
24. **Game Message Bubbles** — MessageBubble renders `type:"game"` as a special gradient card in chat
25. **14 Games**: This or That, Answer & Reveal, Guess My Answer, Secret Unlock, Daily Question, Memory Quiz, Truth or Dare, Complete the Sentence, Rapid Fire, Random Question, Scoreboard, Mood Sync, Build Our World, Ask Panda

## Themes (v3)
5 romantic themes: Blush Love (default), Rose Night (dark), Lavender Dream, Sunset Romance, Classic Love
- Applied via `lib/themes.ts` + `applyTheme()` + `useTheme` (defaults to "blush")
- ThemeSelector shows vertical list with emoji, label, dark badge, checkmark

## File Structure (sweetalk artifact)

```
artifacts/sweetalk/src/
├── App.tsx                        (routes: /, /chat, /album, /starred, /setup-pin)
├── pages/
│   ├── Chat.tsx                   (gamePanelOpen state + GamePanel + game button + sendGameMessage)
│   ├── Login.tsx
│   ├── Album.tsx                  (3 tabs: photos, links, files)
│   ├── Starred.tsx
│   └── SetupPin.tsx
├── components/
│   ├── MessageBubble.tsx          (game bubble branch for type:"game")
│   ├── games/
│   │   ├── GamePanel.tsx          (shell: menu grid + active game routing)
│   │   ├── PandaAvatar.tsx        (PandaAvatar, PandaBubble, PandaThinking, ConfettiBurst)
│   │   ├── ThisOrThat.tsx         (both pick secretly, reveal + Panda comment)
│   │   ├── AnswerReveal.tsx       (category → both answer → reveal side-by-side)
│   │   ├── GuessMyAnswer.tsx      (answerer hides answer, guesser tries, Panda scores)
│   │   ├── SecretUnlock.tsx       (create Q+secret, partner guesses)
│   │   ├── OneQuestionADay.tsx    (daily Firestore doc, streak tracking)
│   │   ├── MemoryQuiz.tsx         (5 Panda-generated MCQ questions)
│   │   ├── TruthOrDare.tsx        (pick type + vibe, Panda generates prompt)
│   │   ├── CompleteSentence.tsx   (Panda gives starter, both complete secretly)
│   │   ├── RapidFire.tsx          (30s timer, tap-to-answer rapid questions)
│   │   ├── RandomQuestion.tsx     (category pick, Panda generates, discuss)
│   │   ├── Scoreboard.tsx         (total pts, game counts, history)
│   │   ├── MoodSync.tsx           (pick mood per hour, reveal simultaneously)
│   │   ├── BuildOurWorld.tsx      (unlock world items at game round milestones)
│   │   └── AskPanda.tsx           (open chat with Panda AI for advice)
│   ├── EmojiPicker.tsx
│   ├── VoiceRecorder.tsx
│   ├── TypingIndicator.tsx
│   ├── CallManager.tsx
│   ├── PinLock.tsx
│   ├── ChatSettings.tsx
│   ├── ThemeSelector.tsx
│   └── WallpaperSelector.tsx
├── lib/
│   ├── firebase.ts
│   ├── firestore.ts               (Message + GameData types; sendMessage supports "game" type)
│   ├── gameFirestore.ts           (NEW: all game Firestore helpers + pandaMemory)
│   ├── panda.ts                   (NEW: Groq API wrapper for games — generateQuestion, evaluateAnswer, etc.)
│   ├── panda_ai.ts                (existing: Panda chat replies)
│   ├── storage.ts
│   ├── webrtc.ts
│   ├── crypto.ts
│   ├── biometric.ts
│   ├── themes.ts                  (5 romantic themes)
│   ├── faviconBadge.ts
│   ├── offlineQueue.ts
│   └── formatText.tsx
├── hooks/
│   ├── useTheme.ts                (defaults to "blush")
│   └── usePinLock.ts
└── contexts/
    └── AuthContext.tsx
```

## Firestore Collections
- `messages/` — chat messages (type: text|image|voice|video|document|game)
- `games/{gameType}/rounds/` — game state per round
- `games/dailyquestion/days/` — one doc per date key
- `games/moods/entries/` — one doc per hour key
- `games/ourworld/rooms/main` — world items + round count
- `pandaMemory/main` — evolving Panda game context
- `userPresence/`, `typingStatus/`, `pinnedMessages/`, `sharedNote/`, `aiMemory/`, `calls/`, `userPreferences/`

## Firestore Rules
Rules file at `artifacts/sweetalk/firestore.rules` — must be copy-pasted to Firebase Console → Firestore → Rules (not auto-deployed).
