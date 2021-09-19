const worker = require("./worker.js");

let express = require("express");
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