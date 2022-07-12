const express = require("express");
const reader = require("xlsx");
const app = express();
const chalk = require("chalk");

const routes = require("./server/index");

const mongoose = require("./server/models/config");

var cors = require("cors");

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(routes);

const { PythonShell } = require("python-shell");

app.post("/", async (req, res) => {


    const file = reader.readFile('./test.xlsx')

    var a = req.body;
  
    // Sample data set
    
    let student_data = [];

    var ob = {};

    Object.keys(a).map((aa)=>{
         ob[aa] = a[aa];
    })

    student_data.push(ob);

    console.log("coming");
    console.log(req.body);



    var options = {
        mode: 'text',
        pythonPath: 'python',
        pythonOptions: ['-u'],
        scriptPath: '',
        args: ['Ritvik', '8', 'value3']
    };
        
    
    await PythonShell.run("./test.py", options, function (err, result) {
        if (err) throw err;
        console.log("result: ", result);
        res.send("abc");
    });


  console.log("coming");
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
});

//     const spawn = require("child_process").spawn;
//     const pythonProcess = exec('python3',["./test.py", 2, 4]);

//         pythonProcess.stdout.on('data', function(data) {
//             console.log(data.toString('utf-8'))
//         } )

const port = 8000;
app.listen(port, () => console.log(`${chalk.green("✓")} ${chalk.magenta(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`));
