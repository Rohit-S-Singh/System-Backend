const express = require("express");
const reader = require("xlsx");
const app = express();
const chalk = require("chalk");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const routes = require("./server/index");

const mongoose = require("./server/models/config");
var cors = require("cors");

// middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialised: true,
  })
);
app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("../Recomendation-System-Backend/server/passportConfig")(passport);

app.use(routes);

//required to run python
const { PythonShell } = require("python-shell");


app.post("/:name", async (req, res) => {
  const file = reader.readFile("./test.xlsx");

  var name = req.params.name;

   console.log(name,"nameeeeeeeeee");

  var a = req.body;

  let student_data = [];

  var ob = {};

  Object.keys(a).map((aa) => {
    ob[aa] = a[aa];
  });

  student_data.push(ob);

  console.log("coming");
  console.log(req.body);

  var options = {
    mode: "text",
    pythonPath: "python",
    pythonOptions: ["-u"],
    scriptPath: "",
    args: [name],
  };

  await PythonShell.run("./test.py", options, function (err, result) {
    if (err) throw err;
    console.log("result: ", result);
    res.send("abc");
  });
});


//home Route

app.get('/notfound',(req,res)=>{
 return res.status(400).json({
       success: false,
   message: "Incorrect Password or email please try again.",
 });
})

const port = 8000;

app.listen(port, () =>
  console.log(
    `${chalk.green("✓")} ${chalk.magenta(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  )
);




























//     const spawn = require("child_process").spawn;
//     const pythonProcess = exec('python3',["./test.py", 2, 4]);

//         pythonProcess.stdout.on('data', function(data) {
//             console.log(data.toString('utf-8'))
//         } )
//   console.log(req.body);
//   var options = {
//     mode: "text",
//     pythonPath: "python",
//     pythonOptions: ["-u"],
//     scriptPath: "",
//     args: ["Ritvik", "8"],
//   };

//   await PythonShell.run("./test.py", options, function (err, result) {
    //     if (err) throw err;
//     console.log("result: ", result);

//     // res.send("abc");
//     res.status(200).json({ message: "helloworld", data: result });
//   });

// --------------------------------------------XXXXX---------------------------------------------------------------

