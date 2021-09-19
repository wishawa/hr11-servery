const fetch = require("node-fetch");
const fs = require('fs');
const {api_key} = JSON.parse(fs.readFileSync('keys.json', {encoding:'utf8', flag:'r'}));
const wiki_CX = "17125c511a5a54b01";
const wikisearch = require("./wikisearch.js");

async function getData(query){
    console.log(`https://www.googleapis.com/customsearch/v1?key=${api_key}&cx=${wiki_CX}&q=sunfish%20wikipedia`);
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${api_key}&cx=${wiki_CX}&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    qStr = data.items[0].link.split("/").pop();
    return qStr
    //pass above in wiki
    
    //console.log(Object.keys(data));
}

/*getData("moroccan rice pilaf").then((x)=>{
    console.log(x);
    (async ()=>{
        foodSummary = await wikisearch(x);
        console.log(foodSummary);
    })();
})*/