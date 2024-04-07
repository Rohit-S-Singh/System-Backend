const express = require('express')

const app = express()
// const PORT = 9000

const http = require('http');
// const socketIo = require('socket.io');

const server = http.createServer(app);
// const io = socketIo(server);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});


io.on('connection', (socket) => {
  console.log('A client connected');

  // Example: Send a message to the client when they connect
  socket.emit('message', 'Welcome to the server!');

  // Example: Listen for messages from the client
  socket.on('new-message', (data) => {
      console.log('Message from client:', data);

      // Example: Broadcast the received message to all clients
      io.emit('rcvd-message', data);
  });

  // Example: Listen for disconnect events
  socket.on('disconnect', () => {
      console.log('A client disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳') 
})



// dbdata
let users = [{email:"rohit.singh0@gmail.com",password:"12345"},{email:"rohit.singh1@gmail.com",password:"12345"},{email:"rohit.singh2@gmail.com",password:"12345"}]

app.get('/auth', (req,res)=>{

  let email = req.body.email;
  let password = req.body.password;

  //checking
  if(users.includes({"email":email,"password":password})){
    return res.json({
      status:200,
      message:"User Found",
      data:users[0]
    })
  }
  else{
    return res.json({
      status:400,
      message:"User not Found",
      data:null
    })
  }
})


// listening to my server
const port = process.env.PORT ||8080;

// Listen on `port` and 0.0.0.0
// server.listen(port, "0.0.0.0", (req,res)=> {
//   // ...

//   console.log("listening");
// });

// local test
server.listen(port, (req,res)=> {
  // ...

  console.log("listening");
});






















// // const express = require("express");
// // const reader = require("xlsx");
// // const app = express();
// // const chalk = require("chalk");
// // const passport = require("passport");
// // const cookieParser = require("cookie-parser");
// // const bcrypt = require("bcryptjs");
// // const session = require("express-session");
// // const routes = require("./server/index");

// // const fs = require("fs");
// // const csv = require("csv-parser");
// // const createCsvWriter = require("csv-writer").createObjectCsvWriter;

// // const mongoose = require("./server/models/config");
// // var cors = require("cors");

// // // middlewares
// // app.use(cors());
// // app.use(express.urlencoded({ extended: true }));
// // app.use(express.json());
// // app.use(
// //   session({
// //     secret: "secretcode",
// //     resave: true,
// //     saveUninitialised: true,
// //   })
// // );
// // app.use(cookieParser("secretcode"));


// // app.use(passport.initialize());
// // app.use(passport.session());
// // require("../Recomendation-System-Backend/server/passportConfig")(passport);

// // // app.use(routes);

// // //required to run python
// // // const { PythonShell } = require("python-shell");

// // // app.post("/:name", async (req, res) => {
// // //   console.log(req.body);

// // //   var users = [];

// // //   fs.createReadStream("ratings.csv")
// // //     .pipe(csv())
// // //     .on("data", function (row) {
// // //       var arr = Object.keys(row);

// // //       const user = {
// // //         movie: row.dummy,
// // //       };

// // //       for (var i = 1; i < arr.length; i++) {
// // //         user[arr[i]] = row[arr[i]];
// // //       }

// // //       users.push(user);
// // //     })
// // //     .on("end", function () {
// // //       // we have users as []

// // //       const newUser = req.params.name;
// // //       const NewRating = {
// // //         movie: Object.keys(req.body)[0],
// // //         Rating: req.body[Object.keys(req.body)[0]],
// // //       };

// // //       console.log("newUser",newUser);
// // //       console.log("newUser", NewRating);

// // //          var ourUsers = Object.keys(users[0]);
// // //          ourUsers.splice(0, 1);

// // //          var ourMovies = [];

// // //          for (var i = 0; i < users.length; i++) {
// // //            ourMovies.push(users[i].movie);
// // //          }

// // //          var indexMovie = ourMovies.indexOf(NewRating.movie);
// // //          var indexUser = ourUsers.indexOf(newUser);

// // //          console.log(indexMovie, " ", indexUser);

// // //          if (indexUser === -1) {
// // //            ourUsers.push(newUser);
// // //            users.map((user) => {
// // //              user[newUser] = "";
// // //            });

// // //            if (indexMovie != -1) {
// // //              users[indexMovie][newUser] = NewRating.Rating;
// // //            }
// // //          }

// // //          if (indexMovie === -1) {
// // //            var obj = {};
// // //            ourMovies.push(NewRating.movie);
// // //            obj["movie"] = NewRating.movie;

// // //            for (var i = 0; i < ourUsers.length; i++) {
// // //              obj[ourUsers[i]] = "";
// // //            }
// // //            users.push(obj);
// // //            users[users.length - 1][newUser] = NewRating.Rating;
// // //          }

// // //          var arrr = [];

// // //          arrr = Object.keys(users[0]);

// // //          // for(var i = 0 ; i < users.length ; i++){
// // //          //     arrr.push(users[i].movie);
// // //          // }

// // //          arrr.splice(0, 1);

// // //          var br = [];

// // //          br.push({ id: "dummy", title: "dummy" });

// // //          for (var i = 0; i < arrr.length; i++) {
// // //            br.push({ id: arrr[i], title: arrr[i] });
// // //          }

// // //          const csvWriter = createCsvWriter({
// // //            path: "ratings.csv",
// // //            header: br,
// // //          });

// // //          const data = [];

// // //          var z = 0;

// // //          console.log(ourUsers);

// // //          for (var i = 0; i < users.length; i++) {
// // //            var obj = {};

// // //            var movie = users[i].movie;

// // //            obj["dummy"] = users[i].movie;

// // //            for (var j = 0; j < ourUsers.length; j++) {
// // //              obj[ourUsers[j]] = users[i][ourUsers[j]];
// // //            }
// // //            data.push(obj);
// // //          }

// // //       csvWriter
// // //         .writeRecords(data)
// // //         .then(() => console.log("The CSV file was written successfully"));
// // //     });

// // //   const file = reader.readFile("./test.xlsx");

// // //   var name = req.params.name;

// // //   console.log(name, "nameeeeeeeeee");

// // //   var a = req.body;

// // //   let student_data = [];

// // //   var ob = {};

// // //   Object.keys(a).map((aa) => {
// // //     ob[aa] = a[aa];
// // //   });

// // //   student_data.push(ob);

// // //   console.log("coming");
// // //   console.log(req.body);

// // //   var options = {
// // //     mode: "text",
// // //     pythonPath: "python",
// // //     pythonOptions: ["-u"],
// // //     scriptPath: "",
// // //     args: [name],
// // //   };

// // //   await PythonShell.run("./test.py", options, function (err, result) {
// // //     if (err) throw err;
// // //     console.log("result: ", result);
// // //     res.send("abc");
// // //   });
// // // });

// // //home Route

// // app.get('/', (req, res) => {
// //   res.send('Hey this is my API running 🥳')
// // })


// // app.get("/notfound", (req, res) => {
// //   return res.status(400).json({
// //     success: false,
// //     message: "Incorrect Password or email please try again.",
// //   });
// // });

// // const port = 8000;

// // app.listen(port, () =>
// //   console.log(
// //     `${chalk.green("✓")} ${chalk.magenta(
// //       `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
// //     )}`
// //   )
// // );