const express = require("express");
const reader = require('xlsx')
const app = express();

var cors = require("cors");

app.use(cors());


app.use(express.urlencoded({ extended: true }));

app.use(express.json());

const { PythonShell } = require("python-shell");

app.post("/", (req, res) => {

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


  res.status(200).json({message:"helloworld"});

  // PythonShell.run("./test.py", options, function (err, result) {
  //   if (err) throw err;
  //   console.log("result: ", result.toString());
  //   res.send("abc");
  // });
});

const port = 8000;
app.listen(port, () => console.log(`Server connected to ${port}`));


// const ws = reader.utils.json_to_sheet(student_data)
  
// reader.utils.book_append_sheet(file,ws,"Sheet3")
  
// Writing to our file
// reader.writeFile(file,'./test.xlsx')