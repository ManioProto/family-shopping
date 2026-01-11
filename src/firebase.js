import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC2h3vZsRtdIY2VxbHIhjbpKrl08q4SGpI",
  authDomain: "family-shopping-38d83.firebaseapp.com",
  databaseURL: "https://family-shopping-38d83-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "family-shopping-38d83",
  storageBucket: "family-shopping-38d83.firebasestorage.app",
  messagingSenderId: "186309902276",
  appId: "1:186309902276:web:834aedad03852ed52eae91"
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
