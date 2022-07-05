const express = require("express");
const app = express();
var cors = require("cors");
app.use(cors());
const { PythonShell } = require("python-shell");

app.get("/", (req, res, next) => {
  console.log(req.query);
  res.status(200).json({ user: "poiuygf" });
});

const port = 8000;
app.listen(port, () => console.log(`Server connected to ${port}`));
