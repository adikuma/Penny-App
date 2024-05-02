// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0JsVGqT5MfKcRKvKg6WMoKc4I9oK1A-o",
  authDomain: "financeapp-e8a99.firebaseapp.com",
  projectId: "financeapp-e8a99",
  storageBucket: "financeapp-e8a99.appspot.comt",
  messagingSenderId: "946312166769",
  appId: "1:946312166769:web:c869ae84f092e2678b0ad0",
  measurementId: "G-0R6F5GSF7D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log(db);  // Check the output in your React Native debug console

export default db;
