const mongoose = require("mongoose");

const chalk = require("chalk");
// mongoose.set("useCreateIndex", true);
mongoose
  .connect("mongodb://localhost:27017", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false,
  })
  .then(() =>
    console.log(`${chalk.green("✓")} ${chalk.blue("MongoDB Connected!")}`)
  )
  .catch((err) => console.log(err));

// mongodb+srv://pjain1206:seeyou12345@cluster0.jwuxxx1.mongodb.net/?retryWrites=true&w=majority  -> for the cloud one
