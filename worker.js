const cron = require('node-cron');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const firebase = require('firebase-admin');
const serviceAccount = require("./firebase-secret.json");

firebase.initializeApp({
	credential: firebase.credential.cert(serviceAccount),
	databaseURL: "https://hr11-servery-app-default-rtdb.firebaseio.com"
});

const firestore = firebase.firestore();

const URLS_LIST = {
	south: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/South-Servery-Menu.html",
	north: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/North-Servery-Menu.html",
	west: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/West-Servery-Menu.html",
	baker: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/Baker-Kitchen-Menu.html",
	seibel: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/Seibel-Servery-Menu.html",
};

function processSection(section, c) {
	const mealsTds = [];
	c(section).find('div.item > div.options > table.menu-items > tbody > tr > td').map((_idx, td) => mealsTds.push(td));
	return mealsTds.map((td) => {
		const s = c(td);
		const name = s.find("div.mitem").text().split("\n").join("");
		const labels = [];
		s.find("div.icons.icon-only").map((_idx, lbl) => {
			const labelClass = c(lbl).attr('class').split(' ').pop();
			const labelText = labelClass.slice(6);
			labels.push(labelText);
		});
		return {
			name,
			labels
		};
	});
}

async function scrapeOne(url) {
	const response = await fetch(url, {
		method: 'get',
	});
	const text = await response.text();
	const c = cheerio.load(text);
	const list = [];
	c("body").find("div.menu-scaffold > div.html-scaffold-body > div.menu-list > div.item-group.inside-daily-menu").map((_idx, elem) => list.push(elem));
	const [lunch, dinner] = list;
	return {
		lunch: processSection(lunch, c),
		dinner: processSection(dinner, c),
	};
}


async function cronJob() {
	const query = firestore.collection("users");
	const snapshot = await query.get();
	const docs = snapshot.docs.map(docSnapshot => {
		const data = docSnapshot.data();
		return {
			name: data.displayName,
			number: data.phone,
			restr: data.rstr ?? [],
			prefs: data.pref ?? [],
			prefsKeys: data.free ?? [],
			foodRecs: {

			}
		}
	});
	return docs;
}

const job = cron.schedule('5 0 0 * * *', cronJob);

module.exports = {
	URLS_LIST: URLS_LIST,
	processSection: processSection,
	scrapeOne: scrapeOne,
	job: job,
	cronJob:cronJob
}