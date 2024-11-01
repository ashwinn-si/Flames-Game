const express = require("express")

const app = express();

const mongoose = require("mongoose")

const session = require("express-session");

const MongoStore = require("connect-mongo");

const path = require("path")

const bodyParser = require("body-parser")

require('dotenv').config();

const mongoURL = process.env.MONGODB_URI;

mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    console.log("db connected");
}).catch((err)=>{
    console.log("db not connected");
})

const userSchema = new mongoose.Schema({
    date : { type: String },
    time : { type: String },
    boyName:{type: String},
    girlName:{type: String},
    relationship:{type:String },
})

const UserDetails = mongoose.model('UserInfo',userSchema);


app.use(bodyParser.json());

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));


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


app.use(session({
    secret: 'sjdasjdsaoidmasoidasiodmas', 
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions' // Optional, you can specify a custom collection name
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day expiration
}));

app.use(express.static(path.join(__dirname,"public")))

app.get("/",(req,res)=>{
    res.status(200).render("main")
})

app.post("/savingDetails", async (req,res)=>{
    let boyName = req.body.boyName
    let girlName = req.body.girlName
    let boyRemoveIndex = req.body.boyRemoveIndex
    let girlRemoveIndex = req.body.girlRemoveIndex
    let relationship = req.body.relationship

    req.session.details={
        boyName,
        girlName,
        boyRemoveIndex,
        girlRemoveIndex,
        relationship
    }
    const { date, time } = getFormattedDateAndTime(); 

    //saving in database
    const user = new UserDetails({
        date: date,
        time: time,
        boyName: Array.isArray(boyName) ? boyName.join("") : boyName,
        girlName: Array.isArray(girlName) ? girlName.join("") : girlName,
        relationship
    });
    await user.save()
    .then(res.status(200).json({redirectUrl : "/result"}));
});

app.get("/result", (req, res) => {
    if (!req.session.details) {
        // If session details are missing, handle it gracefully
        return res.status(400).send("Session details are missing. Please submit the form again.");
    }

    const { 
        boyName = "", 
        girlName = "", 
        relationship = "", 
        boyRemoveIndex = null, 
        girlRemoveIndex = null 
    } = req.session.details || {};

    // Render the result page with session data
    res.render("result", {
        boyName,
        girlName,
        relationship,
        boyRemoveIndex,
        girlRemoveIndex
    });

    req.session.details = null;
});


app.listen(3000,()=>{
    console.log("server started");
})
