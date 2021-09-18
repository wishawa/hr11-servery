const cron = require('node-cron');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const URLS_LIST = {
	south: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/South-Servery-Menu-Full-Week.html",
	north: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/North-Servery-Menu-Full-Week.html",
	west: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/West-Servery-Menu-Full-Week.html",
	baker: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/Baker-Servery-Menu-Full-Week.html",
	seibel: "https://websvc-aws.rice.edu:8443/static-files/dining-assets/Seibel-Servery-Menu-Full-Week.html",
};

function processSection(section, c) {
	const daysTables = [];
	c(section).find('div.item > div.options > table.menu-items').map((_idx, table) => daysTables.push(table));
	const daysMeals = daysTables.map((table) => {
		const mealsTds = [];
		c(table).find('tbody > tr > td').map((_idx, td) => mealsTds.push(td));
		return mealsTds.map((td) => {
			const s = c(td);
			const name = s.find("div.mitem").text();
			const labels = [];
			s.find("div.icons.icon-only").map((_idx, lbl) => {
				const classes = c(lbl).attr('class').split(' ');
				const labelClass = classes[classes.length - 1];
				const labelText = labelClass.split('-')[1];
				labels.push(labelText);
			});
			return {
				name,
				labels
			};
		});
	});
	return daysMeals;
}

async function scrapeOne(url) {
	const response = await fetch(url, {
		method: 'get',
	});
	const text = await response.text();
	const c = cheerio.load(text);
	const list = [];
	c("body").find("div.menu-scaffold > div.html-scaffold-body > div.menu-list > div.item-group.weekly-menu").map((_idx, elem) => list.push(elem));
	const [lunches, dinners] = list;
	return {
		lunches: processSection(lunches, c),
		dinners: processSection(dinners, c),
	};
}


const job = cron.schedule('0 0 0 * * *', () => {
	
});