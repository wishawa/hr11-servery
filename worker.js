const cron = require('node-cron');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

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
		const name = s.find("div.mitem").text();
		const labels = [];
		s.find("div.icons.icon-only").map((_idx, lbl) => {
			const labelClass = c(lbl).attr('class').split(' ').pop();
			const labelText = labelClass.split('-')[1];
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
	const [lunches, dinners] = list;
	return {
		lunches: processSection(lunches, c),
		dinners: processSection(dinners, c),
	};
}


const job = cron.schedule('0 5 0 * * *', () => {
	
});