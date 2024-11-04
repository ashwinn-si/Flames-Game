const express = require("express")

const app = express();

const mongoose = require("mongoose")

const session = require("express-session");

const MongoStore = require("connect-mongo");

const path = require("path")

const bodyParser = require("body-parser");


require('dotenv').config();

const mongoURL = process.env.MONGODB_URI;

let curr_id ="";

mongoose.connect(mongoURL).then(()=>{
    console.log("db connected");
}).catch((err)=>{
    console.log("db not connected");
})

const userSchema = new mongoose.Schema({
    date : { type: String },
    time : { type: String },
    boyName:{type: String},
    girlName:{type: String},
    boyRemoveIndex:{type :[String]},
    girlRemoveIndex:{type:[String]},
    relationship:{type:String },
})

const UserDetails = mongoose.model('UserInfo',userSchema);


app.use(bodyParser.json());

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,"public")))

const getFormattedDateAndTime = () => {
    const now = new Date();
  
    // Convert the date and time to IST (Indian Standard Time)
    const istDateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    // Extract and format date as DD-MM-YYYY
    const [datePart, timePart] = istDateTime.split(', ');
    const [month, day, year] = datePart.split('/');
    const date = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    
    // Format time as HH:MM:SS
    const time = timePart;
    
    return { date, time };
  };

app.get("/",(req,res)=>{
    res.status(200).render("main")
})

app.post("/savingDetails", async (req,res)=>{
    let boyName = req.body.boyName
    let girlName = req.body.girlName
    let boyRemoveIndex = req.body.boyRemoveIndex
    let girlRemoveIndex = req.body.girlRemoveIndex
    let relationship = req.body.relationship;
    const { date, time } = getFormattedDateAndTime(); 

    const user = new UserDetails({
        date: date,
        time: time,
        boyName: boyName.join(""),
        girlName: girlName.join(""),
        relationship : relationship,
        boyRemoveIndex : boyRemoveIndex,
        girlRemoveIndex : girlRemoveIndex
    });
    await user.save().then(
        curr_id = user._id
    )
    .then(res.status(200).json({redirectUrl : "/result"}));
});

app.get("/result",  async (req, res) => {
    const SavedUserDeatails =  await UserDetails.findById(curr_id);
    
    console.log(SavedUserDeatails);
    res.render("result",{
        girlName : SavedUserDeatails.girlName,
        boyName : SavedUserDeatails.boyName,
        relationship : SavedUserDeatails.relationship,
        boyRemoveIndex : SavedUserDeatails.boyRemoveIndex,
        girlRemoveIndex: SavedUserDeatails.girlRemoveIndex
    });
});


app.get('/returnHome', (req, res) => {
    curr_id="";
    res.render('main'); 
});

app.listen(3000,()=>{
    console.log("server started");
})
