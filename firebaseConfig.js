import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCsb3TAGK_FLv7rn5hlEwDq6asH6qWzuSA",
  authDomain: "sbabadag1.firebaseapp.com",
  databaseURL: "https://sbabadag1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sbabadag1",
  storageBucket: "sbabadag1.appspot.com",
  messagingSenderId: "25031637223",
  appId: "1:25031637223:web:99256b91a575120d92ca42",
  measurementId: "G-87LWBM821R"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };