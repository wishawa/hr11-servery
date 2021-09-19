import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js'
const firebaseConfig = {
	apiKey: "AIzaSyCK08hkN4o9SB44qJgCd3Tbz98AHD0uqAw",
	authDomain: "hr11-servery-app.firebaseapp.com",
	projectId: "hr11-servery-app",
	storageBucket: "hr11-servery-app.appspot.com",
	messagingSenderId: "965388502351",
	appId: "1:965388502351:web:992a318095d0f273bcf13a"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore();