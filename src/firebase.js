import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ========================================
// SETUP INSTRUCTIONS:
// ========================================
// 1. Go to https://console.firebase.google.com/
// 2. Click "Create a project" (or "Add project")
// 3. Name it something like "family-shopping"
// 4. Disable Google Analytics (not needed)
// 5. Once created, click the web icon </> to add a web app
// 6. Register the app (any nickname is fine)
// 7. Copy the firebaseConfig values below
// 8. In the Firebase console, go to "Build" > "Realtime Database"
// 9. Click "Create Database", choose your region, start in TEST MODE
// 10. Deploy your app!
//
// IMPORTANT: After 30 days, update your database rules to:
// {
//   "rules": {
//     ".read": true,
//     ".write": true
//   }
// }
// (or set up proper authentication for better security)
// ========================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};

let app = null;
let database = null;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

export { database };
export default app;
