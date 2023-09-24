// // const mongoose = require("mongoose");

// // const chalk = require("chalk");
// // // mongoose.set("useCreateIndex", true);
// // mongoose
// //   .connect("mongodb+srv://rohitssingh17:Seeyouagain11@cluster0.u94vfbj.mongodb.net/?retryWrites=true&w=majority", {
// //     useNewUrlParser: true,
// //     useUnifiedTopology: true,
// //     ssl: false
// //     // useFindAndModify: false,
// //   })
// //   .then(() =>
// //     console.log(`${chalk.green("✓")} ${chalk.blue("MongoDB Connected!")}`)
// //   )
// //   .catch((err) => console.log(err));

// // // mongodb+srv://pjain1206:seeyou12345@cluster0.jwuxxx1.mongodb.net/?retryWrites=true&w=majority  -> for the cloud one


// const { MongoClient, ServerApiVersion } = require('mongodb'); 

// const uri = "mongodb://rohitssingh17:Seeyouagain11!@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority";

// // "mongodb+srv://rohitssingh17:Seeyouagain11!@cluster0.xo7hitn.mongodb.net/?retryWrites=true&w=majority"

// // mongodb://rohitssingh17:Seeyouagain11!@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority

// // "mongodb://rohitssingh17:Seeyouagain11@ac-q6rylur-shard-00-00.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-01.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-02.u94vfbj.mongodb.net:27017/?ssl=true&replicaSet=atlas-rvzlj1-shard-0&authSource=admin&retryWrites=true&w=majority"

// // mongodb+srv://rohitssingh17:Seeyouagain11!@cluster0.xo7hitn.mongodb.net/?retryWrites=true&w=majority

// // "mongodb+srv://rohitssingh17:Seeyouagain11@cluster0.u94vfbj.mongodb.net/?retryWrites=true&w=majority";
// // mongodb://rohitssingh17:Seeyouagain11@ac-q6rylur-shard-00-00.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-01.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-02.u94vfbj.mongodb.net:27017/?ssl=true&replicaSet=atlas-rvzlj1-shard-0&authSource=admin&retryWrites=true&w=majority
// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);


var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb://rohitssingh17:Seeyouagain11!@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority";

// "mongodb://rohitssingh17:<password>@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority";
MongoClient.connect(uri, async function(err, client) {
  
  console.log("hurray!!!! you are now connected to mongo db cloud....");
  
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object

  const database = client.db("insertDB");
  
  const haiku = database.collection("haiku");
  
  

  // Create a document to insert

  const doc = {

    title: "Record of a Shriveled Datum",

    content: "No bytes, no problem. Just insert a document, in MongoDB",

  }

  // Insert the defined document into the "haiku" collection

  const result = await haiku.insertOne(doc);

  // Print the ID of the inserted document

  console.log(`A document was inserted with the _id: ${result.insertedId}`)

;


  client.close();
});