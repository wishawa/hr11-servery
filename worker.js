const cron = require('node-cron');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const firebase = require('firebase-admin');
const serviceAccount = require("./firebase-secret.json");
const wikisearch = require("./wikisearch.js");
const matching = require("./matching.js");
const notification = require("./notification.js");

firebase.initializeApp({
	credential: firebase.credential.cert(serviceAccount),
	databaseURL: "https://hr11-servery-app-default-rtdb.firebaseio.com"
});

const firestore = firebase.firestore();

const URLS_LIST = {
	South: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/South-Servery-Menu.html",
	North: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/North-Servery-Menu.html",
	West: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/West-Servery-Menu.html",
	Baker: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/Baker-Kitchen-Menu.html",
	Seibel: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/Seibel-Servery-Menu.html",
};

function processSection(section, c) {
	const mealsTds = [];
	c(section).find('div.options > table.menu-items > tbody > tr > td').map((_idx, td) => mealsTds.push(td));
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
	c("body").find("div.menu-scaffold > div.html-scaffold-body > div.menu-list > div.item-group.inside-daily-menu > div.item").map((_idx, elem) => list.push(elem));
	const [lunches, dinners] = list;
	return {
		lunches: processSection(lunches, c),
		dinners: processSection(dinners, c),
	};
}

async function runMeal(timeOfDay, users) {
    let serveries = {};
    try {
        for (const [serveryName, serveryUrl] of Object.entries(URLS_LIST)) {
            const serveryData = await scrapeOne(serveryUrl);
            let curMeals = serveryData[timeOfDay];
            await Promise.all(curMeals.map(async (meal) => {
                const {name} = meal;
                let summary = await wikisearch(decodeURIComponent(await matching.getData(name)));
                meal.summary = summary;
            }));
            serveries[serveryName] = curMeals;
        }
    }
    catch(e) {
        console.error(e);
    }
    
    let foodRecs = {};

    const WEIGHT_WIKIPEDIA_WORD = 1, WEIGHT_PREF_MATCH = 2, WEIGTH_NAME_MATCH = 4;
    for (const user in users) {
        let {restr, prefs, prefsKeys} = users[user];
        for(const [serveryName, serveryMeals] of Object.entries(serveries)) {
            let foodMatches = [];
            let priority = 0;

            serveryMeals.forEach((meal)=>{
                const {name, labels, summary} = meal;
                let addFood = true;
                for(let i = 0 ; i < restr.length ; i++){
                    if(labels.includes(restr[i])){
                        addFood = false;
                        break;
                    }
                }
                
                if(addFood){
                    foodMatches.push(name);
                    for(let i = 0 ; i < prefs.length ;i++){
                        if(labels.includes(prefs[i])){
                            priority += WEIGHT_PREF_MATCH;
                        }
                    }
                    for(let i = 0 ; i < prefsKeys.length ; i++){
                        if(name.toLowerCase().includes(prefsKeys[i].toLowerCase())){
                            priority+=WEIGTH_NAME_MATCH;
                        } else {
                            for(let j = 0 ; j < summary.length ; j++){
                                if(summary[j].toLowerCase().includes(prefsKeys[i].toLowerCase())){
                                    priority += WEIGHT_WIKIPEDIA_WORD;
                                }
                            }
                        }
                    }
                }
            });

            foodRecs[serveryName] = {
                priority: priority,
                foods: foodMatches
            }
        }
        
        let tOrdering = [];
        for(servery in foodRecs){
            tOrdering.push({servery: servery, info: foodRecs[servery]});
        }
        tOrdering.sort((a,b)=>b.info.priority-a.info.priority);
        users[user][timeOfDay] = tOrdering;
    }
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
			lunches: {},
			dinners: {}
		}
	});
	await runMeal("lunches", docs);
	await runMeal("dinners", docs);
	const sendData = [];
	for (const userDoc of docs) {
		const lr = userDoc.lunches;
		const dr = userDoc.dinners;
		const lunch = lr;
		const dinner = dr;
		const number = userDoc.number;
		const name = userDoc.name;
		sendData.push({
			lunch,
			dinner,
			name,
			number
		});
	}
	await Promise.allSettled(sendData.map(notification.formatAndSend));
}

const job = cron.schedule('5 0 0 * * *', cronJob);

module.exports = {
	URLS_LIST: URLS_LIST,
	processSection: processSection,
	scrapeOne: scrapeOne,
	job: job,
	cronJob:cronJob
}

