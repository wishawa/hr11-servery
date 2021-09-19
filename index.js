require("./worker.js");
require("./matching.js");
require("./notification.js");

let express = require("express");
const port = process.env.PORT || 3000;


let app = express();
app.use(express.static("public"));
app.set("view-engine", "ejs");

let server = app.listen(port, ()=>{
    console.log(`Listening to port ${port}`)
})
app.get("/",(req,res)=>{
    res.render("signon.ejs")
});
app.get("/home", (req, res)=>{
    res.render("home.ejs")
});

// GOOGLE SEARCH ENGINE ID: 17125c511a5a54b01

