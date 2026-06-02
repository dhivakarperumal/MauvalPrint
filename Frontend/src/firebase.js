// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_EFro11qj3mX8CA6ozl7W-hW4YDFbdKc",
  authDomain: "mauval-prints.firebaseapp.com",
  projectId: "mauval-prints",
  storageBucket: "mauval-prints.appspot.com",
  messagingSenderId: "990400893274",
  appId: "1:990400893274:web:239c0a86420fadea5fa363",
  measurementId: "G-TVK1BQ98ZV",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
export default app;
