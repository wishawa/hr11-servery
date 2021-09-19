import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, linkWithPhoneNumber, RecaptchaVerifier, signOut } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
import { doc, getFirestore, setDoc } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js'

const firebaseConfig = {
	apiKey: "AIzaSyCK08hkN4o9SB44qJgCd3Tbz98AHD0uqAw",
	authDomain: "hr11-servery-app.firebaseapp.com",
	projectId: "hr11-servery-app",
	storageBucket: "hr11-servery-app.appspot.com",
	messagingSenderId: "965388502351",
	appId: "1:965388502351:web:992a318095d0f273bcf13a"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore();

function goHome() {
	window.location.href = "/home";
}

async function start() {
	const startButton = document.getElementById("start-button");
	const phoneUpdateContainer = document.getElementById("phone-update-area");
	const phoneNumberField = document.getElementById("phone-number-field");
	const phoneCheckButton = document.getElementById("phone-check-button");
	const phoneVerifyField = document.getElementById("phone-verify-field");
	const phoneSubmitButton = document.getElementById("phone-submit-button");
	const phoneCaptchaContainer = document.getElementById("phone-captcha-container");

	const provider = new GoogleAuthProvider();
	provider.addScope('email');
	const auth = getAuth();

	const res = await getRedirectResult(auth);
	if (res) {
		const user = res.user;
		if (user.email.split("@").pop() !== "rice.edu") {
			alert("You're not using an @rice.edu Google account. Please try again with an @rice.edu Google account.");
			signOut(auth);
		}
		else if (!!user.phoneNumber) goHome();
		else {
			startButton.classList.add('hidden');
			phoneUpdateContainer.classList.remove('hidden');
			phoneCheckButton.onclick = async () => {
				const phoneValue = phoneNumberField.value;
				const appVerifier = new RecaptchaVerifier(phoneCaptchaContainer, {}, auth);
				const confirmRes = await linkWithPhoneNumber(user, phoneValue, appVerifier);
				phoneSubmitButton.onclick = async () => {
					const verCode = phoneVerifyField.value;
					const credentials = await confirmRes.confirm(verCode);
					const user = credentials.user;
					await setDoc(doc(db, 'users', user.uid), {
						displayName: user.displayName,
						email: user.email,
						phone: user.phoneNumber,
					});
					goHome();
				}
			}
		}
	}
	startButton.onclick = () => {
		signInWithRedirect(auth, provider);
	};
}
window.addEventListener('load', start);
