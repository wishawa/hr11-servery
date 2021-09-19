import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js';
import { getAuth, signInWithRedirect, GoogleAuthProvider, linkWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
import {collection, setDoc} from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js'


const firebaseConfig = {
	apiKey: "AIzaSyCK08hkN4o9SB44qJgCd3Tbz98AHD0uqAw",
	authDomain: "hr11-servery-app.firebaseapp.com",
	projectId: "hr11-servery-app",
	storageBucket: "hr11-servery-app.appspot.com",
	messagingSenderId: "965388502351",
	appId: "1:965388502351:web:992a318095d0f273bcf13a"
};
const app = initializeApp(firebaseConfig);
const db = app.firestore();


const startButton = document.getElementById("start-button");
const phoneUpdateContainer = document.getElementById("phone-update-area");
const phoneNumberField = document.getElementById("phone-number-field");
const phoneCheckButton = document.getElementById("phone-check-button");
const phoneVerifyField = document.getElementById("phone-verify-field");
const phoneSubmitButton = document.getElementById("phone-submit-button");
const phoneCaptchaContainer = document.getElementById("phone-captcha-container");

function goHome() {
	window.location.href = "/home";
}

async function start() {
	const provider = new GoogleAuthProvider();
	provider.addScope('email');
	const auth = getAuth();

	const res = await getRedirectResult(auth);
	if (res) {
		const user = res.user;
		if (user.phoneNumber) goHome();
		else {
			phoneUpdateContainer.classList.remove('hidden');
			phoneCheckButton.onclick = async () => {
				const phoneValue = phoneNumberField.value;
				const appVerifier = new RecaptchaVerifier(phoneCaptchaContainer, {}, auth);
				const confirmRes = await linkWithPhoneNumber(user, phoneValue, appVerifier);
				phoneSubmitButton.onclick = async () => {
					const verCode = phoneVerifyField.value;
					const credentials = await confirmRes.confirm(verCode);
					const user = credentials.user;
					const docRef = await setDoc(doc(db, 'users', user.uid), {
						displayName: user.displayName,
						email: user.email,
						phone: user.phoneNumber,
					});
					goHome();
				}
			}
		}
	}
	else {
		startButton.onclick = () => {
			signInWithRedirect(auth, provider);
		};
	}
}
start();