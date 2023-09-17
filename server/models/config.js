// const mongoose = require("mongoose");

// const chalk = require("chalk");
// // mongoose.set("useCreateIndex", true);
// mongoose
//   .connect("mongodb+srv://rohitssingh17:Seeyouagain11@cluster0.u94vfbj.mongodb.net/?retryWrites=true&w=majority", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     ssl: false
//     // useFindAndModify: false,
//   })
//   .then(() =>
//     console.log(`${chalk.green("✓")} ${chalk.blue("MongoDB Connected!")}`)
//   )
//   .catch((err) => console.log(err));

// // mongodb+srv://pjain1206:seeyou12345@cluster0.jwuxxx1.mongodb.net/?retryWrites=true&w=majority  -> for the cloud one


const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb://rohitssingh17:Seeyouagain11@ac-q6rylur-shard-00-00.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-01.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-02.u94vfbj.mongodb.net:27017/?ssl=true&replicaSet=atlas-rvzlj1-shard-0&authSource=admin&retryWrites=true&w=majority"

// "mongodb+srv://rohitssingh17:Seeyouagain11@cluster0.u94vfbj.mongodb.net/?retryWrites=true&w=majority";
// mongodb://rohitssingh17:Seeyouagain11@ac-q6rylur-shard-00-00.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-01.u94vfbj.mongodb.net:27017,ac-q6rylur-shard-00-02.u94vfbj.mongodb.net:27017/?ssl=true&replicaSet=atlas-rvzlj1-shard-0&authSource=admin&retryWrites=true&w=majority
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
