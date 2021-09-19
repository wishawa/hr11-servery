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


let serveryChoice = {};
async function initServeries(){
    for (let serveries in worker.URLS_LIST) {
        scrapeOne(worker.URLS_LIST[serveries]).then((serveryData) => {
            for (let mealTime in serveryData) {
                let curMealTime = serveryData[mealTime];
                for (let i = 0; i < curMealTime?.length; i++) {
                    let {name} = curMealTime[i];
                    let curMealSummary = "";
                    matching.getData(name).then(async (searchWord) => {
                            curMealSummary = await wikisearch(searchWord);
                            
                    })
                    curMealTime[i].summary = curMealSummary;
                }
            }
            serveryChoice[serveries] = serveryData;
        });
    }
    //console.log(serveryChoice);
    return serveryChoice;
}
initServeries()
    .catch((e)=>{console.log("caught,", e)})


let WEIGHT1 = 1,
    WEIGHT2 = 2,
    WEIGHT3 = 4;
setTimeout(()=>{
    for(let user in users){
        let {restr, prefs, prefsKeys} = users[user];
        console.log(restr,prefs,prefsKeys)
        for(let servery in serveryChoice){
            let curServery = serveryChoice[servery];
            let foodMatches = [];
            let priority = 0;
            for(let mealTime in curServery){
                let curServeryMeal = curServery[mealTime];
                curServeryMeal.forEach((indMeal)=>{
                    //name and labels and summary
                    let {name, labels, summary} = indMeal;
                    let addFood = false;
                    for(let i = 0 ; i < restr.length ; i++){
                        console.log(labels, restr[i], labels.includes(restr[i]));
                        if(labels.includes(restr[i])){
                            addFood = true;
                            break;
                        }
                    }
                    addFood?foodMatches.push(name):null;
                    
                    
                    if(addFood){
                        for(let i = 0 ; i < prefs.length ;i++){
                            if(labels.includes(prefs[i])){
                                priority += WEIGHT2;
                            }
                        }
                        for(let i = 0 ; i < prefsKeys.length ; i++){
                            if(name.toLowerCase().includes(prefsKeys[i].toLowerCase())){
                                priority+=WEIGHT3;
                            }else{
                                for(let j = 0 ; j < summary.length ; j++){
                                    if(summary[j].toLowerCase().includes(prefsKeys[i].toLowerCase())){
                                        priority += WEIGHT1;
                                    }
                                }
                            }
                        }
                    }
                    
                });
            }
            users[user].foodRecs[servery] = {
                priority: priority,
                foods: foodMatches
            }
        }
        
        let tOrdering = [];
        for(servery in users[user].foodRecs){
            tOrdering.push({servery: servery, info: users[user].foodRecs[servery]});
        }
        console.log(tOrdering);
        tOrdering.sort((a,b)=>b.info.priority-a.info.priority);
        console.log(tOrdering);
        users[user].ordering = tOrdering;
    }
},10000);

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