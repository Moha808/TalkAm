# SocialCloud — Social Media Platform

A modern, full-featured social media web application (Instagram + Twitter hybrid) built with **React**, **Tailwind CSS**, and **Firebase** (with **Cloudinary** for image hosting).

---

## ✨ Features

- **Authentication** — Email/password, Google sign-in, unique usernames
- **Posts** — Text + image posts, real-time feed, likes, comments, sharing
- **Profiles** — Photo upload, bio, follower/following counts, post grid
- **Follow System** — Follow/unfollow, suggested users, personalized feed
- **Real-time Chat** — 1-on-1 messaging, seen/typing indicators, media sharing
- **Notifications** — Likes, comments, follows with real-time dropdown
- **Admin Panel** — User management, ban/unban, report moderation
- **Dark/Light Mode** — Theme toggle with localStorage persistence
- **Mobile-first** — Fully responsive with bottom nav on mobile
- **Security** — Firebase Security Rules for Firestore

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Cloudinary account ([cloudinary.com](https://cloudinary.com)) for free image hosting

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Social
npm install
```

### 2. Firebase Setup

1. Create a Firebase project in the console
2. Enable **Authentication** → Email/Password and Google providers
3. Create a **Firestore Database** (start in test mode, then apply rules)
4. Get your Firebase config from **Project Settings > General > Your apps > Web**

### 3. Cloudinary Setup (Free Image Hosting)

1. Sign up for a free account at [Cloudinary](https://cloudinary.com)
2. Go to **Settings > Upload > Upload presets**
3. Click **"Add upload preset"**
4. Set **Signing Mode** to **"Unsigned"**
5. Enter a preset name (e.g., `socialcloud_unsigned`) & Save
6. Copy your **Cloud Name** from the dashboard

### 4. Environment Variables

Create a `.env` file:

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Config
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=socialcloud_unsigned
```

### 5. Deploy Security Rules

Copy the contents of `firestore.rules` into your Firebase console at **Firestore → Rules**. This secures your database.

### 6. Run Locally

```bash
npm run dev
```

### 7. Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── UI.jsx         # Avatar, Button, Input, Modal, Spinner, EmptyState
│   ├── Layout.jsx     # Main layout with responsive sidebar/navigation
│   ├── PostCard.jsx   # Post display with likes, comments, sharing
│   ├── CommentSection.jsx
│   ├── NotificationDropdown.jsx
│   ├── SuggestedUsers.jsx
│   └── ProtectedRoute.jsx
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   └── NotificationContext.jsx
├── pages/              # Route-level components
│   ├── Home.jsx       # Real-time feed with infinite scroll
│   ├── Explore.jsx    # User search + trending posts
│   ├── CreatePost.jsx # Text + image post creation
│   ├── Profile.jsx    # User profiles with grid/list views & Cloudinary upload
│   ├── Messages.jsx   # Real-time 1-on-1 chat
│   ├── Settings.jsx
│   ├── Admin.jsx      # Admin dashboard
│   ├── Login.jsx
│   ├── Signup.jsx
│   └── SetupProfile.jsx
├── services/
│   └── firebase.js    # All Firebase CRUD operations
├── utils/
│   └── helpers.js     # Cloudinary upload & Utility functions
├── firebase.js         # Firebase initialization
├── App.jsx            # Router + providers
├── main.jsx           # Entry point
└── index.css          # Tailwind + design system
```

---

## 🗄️ Firestore Schema

| Collection            | Key Fields                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `users`               | uid, username, displayName, photoURL, bio, followersCount, followingCount, postsCount, role, banned |
| `posts`               | userId, text, imageURL, likesCount, commentsCount, createdAt                                        |
| `comments`            | postId, userId, text, createdAt                                                                     |
| `likes`               | postId, userId, createdAt                                                                           |
| `follows`             | followerId, followedId, createdAt                                                                   |
| `notifications`       | type, senderId, recipientId, postId, read, createdAt                                                |
| `chats`               | participants[], lastMessage, lastMessageTime                                                        |
| `chats/{id}/messages` | senderId, text, mediaURL, seen, createdAt                                                           |
| `reports`             | type, contentId, reporterId, reason, status, createdAt                                              |

---

## 🌐 Deployment

### Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard (both Firebase and Cloudinary vars)
4. Build command: `npm run build` / Output: `dist`

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # Select "dist" as public directory, configure SPA
firebase deploy
```

---

## 🔐 Making a User Admin

In Firestore console, find the user document and set `role: "admin"`.

---

## 📄 License

MIT
