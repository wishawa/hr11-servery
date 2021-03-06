import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, linkWithPhoneNumber, RecaptchaVerifier, signOut } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js'
import { db } from '/firebase.js';

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
				const appVerifier = new RecaptchaVerifier(phoneCaptchaContainer, {
					size: "invisible",
				}, auth);
				try {
					const confirmRes = await linkWithPhoneNumber(user, phoneValue, appVerifier);
					phoneSubmitButton.onclick = async () => {
						const verCode = phoneVerifyField.value;
						try {
							const credentials = await confirmRes.confirm(verCode);
							const user = credentials.user;
							await setDoc(doc(db, 'users', user.uid), {
								displayName: user.displayName,
								email: user.email,
								phone: user.phoneNumber,
							});
							goHome();
						}
						catch(e) {
							alert("Phone number verification failed.");
							window.location.reload();
						}
					}
				}
				catch(e) {
					alert("Phone number submission failed.");
					window.location.reload();
				}
			}
		}
	}
	startButton.onclick = () => {
		signInWithRedirect(auth, provider);
	};
}
window.addEventListener('load', start);
