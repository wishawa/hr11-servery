import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js'
import { db } from '/firebase.js';

const freeList = document.getElementById("free-list");
const freeInput = document.getElementById("free-input");
const freeSubmit = document.getElementById("free-submit");
const welcomeMessage = document.getElementById("welcome-message");
const labelsList = document.getElementById("rstr-labels-list-container");

const mainForm = document.getElementById("main-form");
const nextButton = document.getElementById("next-button");
const backButton = document.getElementById("back-button");
const saveButton = document.getElementById("save-button");

const labels = [
	"eggs",
	"fish",
	"gluten",
	"milk",
	"peanuts",
	"shellfish",
	"soy",
	"tree-nuts",
	"vegan",
	"vegetarian",
];
const labelsNames = {
	"eggs": "Eggs",
	"fish": "Fish",
	"gluten": "Gluten",
	"milk": "Milk",
	"peanuts": "Peanuts",
	"shellfish": "Shellfish",
	"soy": "Soy",
	"tree-nuts": "Tree Nuts",
	"vegan": "Vegan Food",
	"vegetarian": "Vegetarian Food",
};

let choices = {
	rstr: new Set(),
	pref: new Set(),
	free: [],
};

function clearElem(elem) {
	while (true) {
		const first = elem.firstChild;
		if (first) elem.removeChild(first);
		else break;
	}
}

function renderLabelsList() {
	for (const label of labels) {
		const checkbox = document.createElement("input");
		checkbox.setAttribute("type", "checkbox");
		checkbox.classList.add("btn-check");
		checkbox.id = `rstr-checkbox-${label}`;
		const button = document.createElement("label");
		button.setAttribute("for", checkbox.id);
		button.appendChild(document.createTextNode(labelsNames[label]));
		button.classList.add("btn", "label-check");
		if (choices.rstr.has(label)) button.classList.add("btn-danger");
		else button.classList.add("btn-secondary");
		checkbox.addEventListener("change", () => {
			if (checkbox.checked) {
				choices.rstr.add(label);
				button.classList.add("btn-danger");
				button.classList.remove("btn-secondary");
			}
			else {
				choices.rstr.delete(label);
				button.classList.remove("btn-danger");
				button.classList.add("btn-secondary");
			}
		});
		labelsList.appendChild(checkbox);
		labelsList.appendChild(button);
	}
}

function renderFreeItem(freeItem) {
	const itemNode = document.createElement("div");
	itemNode.classList.add("btn-group", "free-item");
	const labelButton = document.createElement("button");
	labelButton.appendChild(document.createTextNode(freeItem));
	labelButton.classList.add("btn", "btn-outline-secondary");
	labelButton.setAttribute("disabled", true);
	const removeButton = document.createElement("button");
	removeButton.classList.add("btn", "btn-danger", "free-item-remove");
	removeButton.appendChild(document.createTextNode("✖"));
	removeButton.addEventListener("click", () => {
		itemNode.remove();
		choices.free = choices.free.filter(e => e != freeItem);
	});
	itemNode.appendChild(labelButton);
	itemNode.appendChild(removeButton);
	freeList.appendChild(itemNode);
}

function renderFreeList() {
	clearElem(freeList);
	for (const freeItem of choices.free) {
		renderFreeItem(freeItem);
	}
}

function addFreeItem() {
	const text = freeInput.value;
	freeInput.value = '';
	if (text?.length && !choices.free.includes(text)) {
		choices.free.push(text);
		renderFreeItem(text);
	}
}

freeInput.addEventListener("keydown", (e) => {
	if (e.code === "Enter") {
		addFreeItem();
	}
});

freeSubmit.addEventListener("click", () => {
	addFreeItem();
});

function start() {
	const auth = getAuth();
	onAuthStateChanged(auth, async (user) => {
		if (user) {
			welcomeMessage.textContent = `Welcome, ${user.displayName.split(" ")[0]}!`;
			const userDocRef = doc(db, 'users', user.uid);
			const userDoc = (await getDoc(userDocRef)).data();
			choices.free = userDoc?.free ?? [];
			choices.rstr = new Set(userDoc?.rstr ?? []);
			choices.pref = new Set(userDoc?.pref ?? []);
			renderLabelsList();
			renderFreeList();
			nextButton.addEventListener('click', () => {
				mainForm.classList.remove("main-form-focus-first");
				mainForm.classList.add("main-form-focus-second");
			});
			backButton.addEventListener('click', () => {
				mainForm.classList.add("main-form-focus-first");
				mainForm.classList.remove("main-form-focus-second");
			});
			saveButton.addEventListener('click', async () => {
				await setDoc(userDocRef, {
					displayName: userDoc.displayName,
					email: userDoc.email,
					phone: userDoc.phone,
					free: choices.free,
					rstr: [...choices.rstr],
					pref: [...choices.pref],
				});
				alert("Saved successfully. We will be texting you!");
			});
		}
		else {
			window.location.href = "/";
		}
	});
	
}

start();
