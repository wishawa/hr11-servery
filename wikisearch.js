const wiki = require('wikipedia');

module.exports = async function getWikiPage(qStr) {
	try {
		const page = await wiki.page(qStr);
		//console.log(page);
		//page.content().then((x)=>{console.log(x.split(" "))});
		//Response of type @Page object
		const summary = await page.summary();
		//console.log(Object.keys(summary));
        //console.log("LOGGED", summary);
		//console.log(summary.extract)
        return summary.extract
		//Res.ponse of type @wikiSummary - contains the intro and the main image
	} catch (error) {
		console.log(error);
		//=> Typeof wikiError
        //console.log("LOGGED2", error);
        return "";
	}
}