# 🏋️ Exercise Tracker - Setup Guide

A step-by-step guide to get your workout data storage working.

---

## Quick Start Checklist

- [ ] Create Firebase project
- [ ] Enable Email/Password authentication  
- [ ] Create Firestore database
- [ ] Copy Firebase config to `.env` file
- [ ] Deploy security rules
- [ ] Deploy indexes
- [ ] Test the app

---

## Step 1: Create Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **Add project**
3. Name it (e.g., `exercise-tracker`)
4. Skip Google Analytics → **Create project**

---

## Step 2: Enable Authentication

1. Go to **Build → Authentication → Get started**
2. Click **Email/Password**
3. Toggle **Enable** → **Save**

---

## Step 3: Create Database

1. Go to **Build → Firestore Database → Create database**
2. Select **Start in production mode**
3. Pick a region near your users → **Enable**

---

## Step 4: Get Your Config

1. Click the **gear icon** → **Project settings**
2. Scroll to **Your apps** → Click the **web icon** `</>`
3. Name your app → **Register app**
4. Copy the config values:

```js
apiKey: "AIza..."
authDomain: "your-project.firebaseapp.com"
projectId: "your-project"
storageBucket: "your-project.appspot.com"
messagingSenderId: "123..."
appId: "1:123..."
```

---

## Step 5: Configure Environment

Create your `.env` file:

```bash
cp .env.example .env
```

Fill in your values:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

VITE_USE_FIREBASE=true
```

---

## Step 6: Deploy Rules & Indexes

```bash
# Login to Firebase
firebase login

# Initialize (select Firestore)
firebase init

# Deploy everything
firebase deploy --only firestore
```

---

## Step 7: Run the App

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

---

## How Data is Stored

```
📁 users/{userId}
├── 📄 Profile (username, email, preferences)
├── 📁 workoutSessions/{id}
│   └── 📄 Session with exercises[] and sets[]
├── 📁 workoutsCompleted/{date}
│   └── 📄 Calendar summary
└── 📁 workoutTemplates/{id}
    └── 📄 Saved workout programs
```

**Example workout session:**
```
{
  name: "Push Day",
  type: "push",
  status: "completed",
  exercises: [
    {
      name: "Bench Press",
      sets: [
        { reps: 10, weight: 135, setNumber: 1 },
        { reps: 8, weight: 145, setNumber: 2 }
      ]
    }
  ]
}
```

---

## Verify It Works

| Test | Expected |
|------|----------|
| Create account | Redirects to onboarding |
| Set username | Lands on dashboard |
| Start workout | Session created |
| Log sets | Sets appear in UI |
| Complete workout | Shows on calendar |

---

## Troubleshooting

### "Firebase configuration is missing"
→ Check `.env` has all `VITE_FIREBASE_*` values  
→ Make sure `VITE_USE_FIREBASE=true`

### "Permission denied"
→ Deploy security rules: `firebase deploy --only firestore:rules`

### "Query requires an index"
→ Click the link in the error, OR  
→ Run: `firebase deploy --only firestore:indexes`

### Workout not on calendar
→ Make sure you clicked **Complete Workout**  
→ Check the session status is "completed"

### Sets not saving
→ Open browser console for errors  
→ Check all inputs have values (no empty fields)

---

## Production Deployment

**Firebase Hosting:**
```bash
npm run build
firebase deploy --only hosting
```

**Vercel/Netlify:**
1. Connect your GitHub repo
2. Add environment variables in dashboard
3. Deploy

---

## Need Help?

1. Check browser console for errors
2. Look at Firestore Console for data
3. Verify `.env` values match Firebase config

---

*Last updated: December 31, 2025*
