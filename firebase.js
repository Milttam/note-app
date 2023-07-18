// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore"
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqCf3R34FoDMysQEpD4ah6OCt2DWoH2rM",
  authDomain: "note-app-21b1d.firebaseapp.com",
  projectId: "note-app-21b1d",
  storageBucket: "note-app-21b1d.appspot.com",
  messagingSenderId: "425122078648",
  appId: "1:425122078648:web:573b756208b149e337b94d",
  measurementId: "G-59MTQ14J1M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const notesCollection = collection(db, "notes")