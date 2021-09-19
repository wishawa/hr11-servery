const worker = require("./worker.js");
const matching = require("./matching.js");
require("./notification.js");

let express = require("express");
const { workersUrl } = require("twilio/lib/jwt/taskrouter/util");
const { scrapeOne } = require("./worker.js");
const port = process.env.PORT || 3000;


let app = express();
app.use(express.static("public"));
app.set("view-engine", "ejs");

let server = app.listen(port, () => {
    console.log(`Listening to port ${port}`)
})
app.get("/",(req,res)=>{
    res.render("signon.ejs")
});
app.get("/home", (req, res)=>{
    res.render("home.ejs")
});

// GOOGLE SEARCH ENGINE ID: 17125c511a5a54b01

/*
CODE FOR RECEIVING POST REQUESTS AND SENDING A RESPONSE BACK


*/

/*
0. Look through the important criterion and create respective list items for menu.
#+1 for each matched criteria
0.5. dietary restriction check by the images/icons
0.7. do a search of each food item in matching.js and wikisearch, look in the summary.
1. Check if the user's particular string is part of any menu item
2. Check if the user's particular string is connected to any of the food items through wikisearch.
Give Recommendation 
*/
let users;
(async ()=>{users = await worker.cronJob()})();
/*[{
    name: "James",
    number: "224123123",
    restr: ["eggs",
        "fish",
        "gluten",
        "milk",
        "peanuts",
        "shellfish",
        "soy",
        "tree-nuts",
        "vegan",
"vegetarian"],
    prefs: ["shellfish"],
    prefsKeys: ["korean", "chinese", "rice", "bread","thai"],
    foodRecs: {}
}]
*/
/*
This will be in the format 
users
{
    name: str
    number: str
    restr # restrictions: list of str
    prefs # preferences: list of str
    prefsKeys Keywords associated
    foodRecs:{
        north:{
            priority: 4
            foods: []
        }
    }
}
*/
const wikisearch = require("./wikisearch.js");

async function runMeal(timeOfDay) {
    let serveries = {};
    try {
        for (const [serveryName, serveryUrl] of Object.entries(worker.URLS_LIST)) {
            const serveryData = await scrapeOne(serveryUrl);
            let curMeal = serveryData[timeOfDay];
            await Promise.all(curMeal.map(async (meal) => {
                const {name} = meal;
                let summary = await wikisearch(decodeURIComponent(await matching.getData(name)));
                meal.summary = summary;
            }));
            serveries[serveryName] = serveryData;
        }
    }
    catch(e) {
        console.error(e);
    }
    
    
    const WEIGHT_WIKIPEDIA_WORD = 1, WEIGHT_PREF_MATCH = 2, WEIGTH_NAME_MATCH = 4;
    for (const user in users) {
        let {restr, prefs, prefsKeys} = users[user];
        for(const [serveryName, serveryInfo] of Object.entries(serveries)) {
            let foodMatches = [];
            let priority = 0;

            let serveryMeals = serveryInfo[timeOfDay];
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

            users[user].foodRecs[serveryName] = {
                priority: priority,
                foods: foodMatches
            }
        }
        
        let tOrdering = [];
        for(servery in users[user].foodRecs){
            tOrdering.push({servery: servery, info: users[user].foodRecs[servery]});
        }
        tOrdering.sort((a,b)=>b.info.priority-a.info.priority);
        console.log(tOrdering);
        users[user].ordering = tOrdering;
    }
}


/*
eggs
fish
gluten
milk
peanuts
shellfish
soy
tree-nuts
vegan
vegetarian
*/

runMeal("lunches")

setTimeout(()=>{runMeal("dinners")},5000)