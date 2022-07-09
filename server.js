const express = require("express");
const reader = require("xlsx");
const app = express();

var cors = require("cors");

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

const { PythonShell } = require("python-shell");

app.post("/", async (req, res) => {
  console.log("coming");
  console.log(req.body);
  var options = {
    mode: "text",
    pythonPath: "python",
    pythonOptions: ["-u"],
    scriptPath: "",
    args: ["Ritvik", "8"],
  };

  await PythonShell.run("./test.py", options, function (err, result) {
    if (err) throw err;
    console.log("result: ", result);

    // res.send("abc");
    res.status(200).json({ message: "helloworld", data: result });
  });
});
//     const spawn = require("child_process").spawn;
//     const pythonProcess = exec('python3',["./test.py", 2, 4]);

//         pythonProcess.stdout.on('data', function(data) {
//             console.log(data.toString('utf-8'))
//         } )

const port = 8000;
app.listen(port, () => console.log(`Server connected to ${port}`));

// const ws = reader.utils.json_to_sheet(student_data)

// reader.utils.book_append_sheet(file,ws,"Sheet3")

// Writing to our file

// const file = reader.readFile('./test.xlsx')

// var a = req.body;

// // Sample data set

// let student_data = [];

// var ob = {};

// Object.keys(a).map((aa)=>{
//      ob[aa] = a[aa];
// })

// student_data.push(ob);

// reader.writeFile(file,'./test.xlsx')
