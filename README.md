# Family Shopping List

A real-time shared shopping list app for families with:
- **Synced lists** — everyone sees the same list instantly
- **User colours** — each person's items appear in their chosen colour
- **Multiple lists** — create separate lists for different purposes
- **Large text option** — adjustable sizing for easier reading
- **Works like an app** — add to home screen for native app feel

## Quick Setup (15-20 minutes)

### Step 1: Set up Firebase (free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it `family-shopping` (or whatever you like)
4. Disable Google Analytics (not needed) → **Create Project**
5. Once ready, click the **web icon** `</>` to add a web app
6. Register the app with any nickname
7. **Copy the config values** (you'll need these in Step 3)

### Step 2: Enable Realtime Database

1. In Firebase console, go to **Build → Realtime Database**
2. Click **"Create Database"**
3. Choose your region (any works)
4. Select **"Start in test mode"** → **Enable**

> ⚠️ Test mode allows anyone to read/write for 30 days. This is fine for a family app. After 30 days, update rules to keep it open (instructions in firebase.js).

### Step 3: Add your Firebase config

Open `src/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // Your actual API key
  authDomain: "family-shopping-xxxxx.firebaseapp.com",
  databaseURL: "https://family-shopping-xxxxx-default-rtdb.firebaseio.com",
  projectId: "family-shopping-xxxxx",
  storageBucket: "family-shopping-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

### Step 4: Deploy to Vercel (free)

1. Push this code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign up with GitHub
3. Click **"Add New Project"**
4. Select your repository
5. Click **Deploy**

Done! You'll get a URL like `family-shopping-xyz.vercel.app`

### Step 5: Install on phones

On each family member's phone:
1. Open the URL in Safari (iPhone) or Chrome (Android)
2. Tap **Share → Add to Home Screen**
3. The app now appears as an icon and runs fullscreen

## How it works

### First time setup
Each family member enters their name and picks a colour. This only happens once per device.

### Adding items
- Type in the box and press Enter or tap +
- Your items show in your colour
- Frequently used items appear as quick-add buttons
- Everyone sees items appear in real-time

### Multiple lists
- Tap the list name at the top to switch lists
- Create lists for: Groceries, Hardware, Christmas, etc.
- Each list syncs separately

### Completing items
- Tap the checkbox to mark done
- "Clear done" removes all completed items
- Items stay visible until cleared

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Troubleshooting

**Items not syncing?**
- Check your Firebase config is correct
- Ensure Realtime Database is enabled
- Check browser console for errors

**App not working offline?**
- This version requires internet connection
- Offline support could be added with Firebase persistence

**Want to reset everything?**
- In Firebase Console → Realtime Database → Delete all data
- Users will need to set up their names again
