// var MongoClient = require('mongodb').MongoClient;
// // mongodb://localhost:27017
// // Connect to the db
// MongoClient.connect("mongodb://localhost:27017", function (err, db) {
   
//      if(err) throw err;

//      else
//      console.log("connected")

//      //Write databse Insert/Update/Query code here..
                
// });
const mongoose = require("mongoose");
// Connecting to database
mongoose.connect(
  "mongodb://0.0.0.0:27017/",
  {
    dbName: "movie-app",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) =>
    err ? console.log(err) : console.log(
      "Connected to yourDB-name database")
);