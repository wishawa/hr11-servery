import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js'
import { db } from '/firebase.js';

const labelsTable = document.getElementById("labels-table");
const labelsTableHead = document.getElementById("labels-table-head");
const freeList = document.getElementById("free-list");
const freeInput = document.getElementById("free-input");
const freeSubmit = document.getElementById("free-submit");
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
	"vegan": "Vegan",
	"vegetarian": "Vegetarian",
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

function renderTable() {
	const clonedHead = labelsTableHead.cloneNode(true);
	clearElem(labelsTable);
	labelsTable.appendChild(clonedHead);

	for (const label of labels) {
		const tr = document.createElement("tr");
		const labelTd = document.createElement("td");
		labelTd.appendChild(document.createTextNode(labelsNames[label]));
		const rstrTd = document.createElement("td");
		const rstrCheckbox = document.createElement("input");
		rstrCheckbox.setAttribute("type", "checkbox");
		if (choices.rstr.has(label)) rstrCheckbox.setAttribute("checked", true);
		rstrCheckbox.addEventListener("change", () => {
			const checked = rstrCheckbox.checked;
			if (checked) choices.rstr.add(label);
			else choices.rstr.delete(label);
		});
		rstrTd.appendChild(rstrCheckbox);
		const prefTd = document.createElement("td");
		const prefCheckbox = document.createElement("input");
		prefCheckbox.setAttribute("type", "checkbox");
		if (choices.pref.has(label)) prefCheckbox.setAttribute("checked", true);
		prefCheckbox.addEventListener("change", () => {
			const checked = prefCheckbox.checked;
			if (checked) choices.pref.add(label);
			else choices.pref.delete(label);
		});
		prefTd.appendChild(prefCheckbox);
		tr.appendChild(labelTd);
		tr.appendChild(rstrTd);
		tr.appendChild(prefTd);
		labelsTable.appendChild(tr);
	}
}

function renderFreeItem(freeItem) {
	const itemNode = document.createElement("div");
	itemNode.appendChild(document.createTextNode(freeItem));
	const removeButton = document.createElement("button");
	removeButton.appendChild(document.createTextNode("Remove"));
	removeButton.addEventListener("click", () => {
		itemNode.remove();
		choices.free = choices.free.filter(e => e != freeItem);
	});
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
			const userDocRef = doc(db, 'users', user.uid);
			const userDoc = (await getDoc(userDocRef)).data();
			choices.free = userDoc?.free ?? [];
			choices.rstr = new Set(userDoc?.rstr ?? []);
			choices.pref = new Set(userDoc?.pref ?? []);
			renderTable();
			renderFreeList();
			saveButton.addEventListener('click', async () => {
				await setDoc(userDocRef, {
					displayName: userDoc.displayName,
					email: userDoc.email,
					phone: userDoc.phone,
					free: choices.free,
					rstr: [...choices.rstr],
					pref: [...choices.pref],
				});
			});
		}
		else {
			window.location.href = "/";
		}
	});
	
}

start();
