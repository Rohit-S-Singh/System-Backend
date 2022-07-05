const express = require("express");
const app = express();

const { PythonShell } = require("python-shell");

app.get("/", (req, res, next) => {
  let options = {
    mode: "text",
    pythonOptions: ["-u"],
    scriptPath: "",
    args: ["shubhamk314"],
  };

  PythonShell.run("./check.py", options, function (err, result) {
    if (err) throw err;
    // console.log("result: ", result.toString());
    res.send("abc");
  });
});

const port = 8000;
app.listen(port, () => console.log(`Server connected to ${port}`));
