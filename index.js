const express = require('express')

const redis  = require('redis');

const app = express()
const http = require('http');

const mongoose = require("mongoose");
const server = http.createServer(app);


const bodyParser = require('body-parser'); //body-parser

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});


//routers
const communityRouter = require('./server/Routes/communityRoutes');
const chatRouter = require('./server/Routes/chatlog');
const UserRoutes = require('./server/Routes/userRoutes');




//controllers
const {createMessage} = require('./server/controllers/chatlogs');




// Middleware to parse JSON bodies
app.use(bodyParser.json());



//routing
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/user', UserRoutes);
app.use('/api/v1/chats', chatRouter);



//testing my API
app.get('/', (req, res) => {
  res.send('Hey this is my backend is running 🥳') 
})



// // dbdata
// let users = [{email:"rohit.singh0@gmail.com",password:"12345"},{email:"rohit.singh1@gmail.com",password:"12345"},{email:"rohit.singh2@gmail.com",password:"12345"}]

// app.get('/auth', (req,res)=>{
  
  //   let email = req.body.email;
  //   let password = req.body.password;
  
  //   //checking
  //   if(users.includes({"email":email,"password":password})){
    //     return res.json({
//       status:200,
//       message:"User Found",
//       data:users[0]
//     })
//   }
//   else{
  //     return res.json({
    //       status:400,
    //       message:"User not Found",
    //       data:null
    //     })
    //   }
    // })
    
    // db connection
    
    const { createClient } = require('redis');
    
    
    const client = createClient({
      password: "I0Rl8BcPLKY5Ym45WMOZE7iYDyO8pa5E",
      socket: {
        host: 'redis-19032.c240.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 19032
      }
  });

    const checkRedis = async ()=>{
      try{
        await client.connect();
        await client.set('key', 'value');
        const value = await client.get('key');
        await client.disconnect();
      }  
      catch(err){
        console.log(err);
      }  
    }  
    
    checkRedis();



// setting socket 
io.on('connection', (socket) => {
  console.log('A client connected');

  

  // Example: Send a message to the client when they connect

  socket.emit('message', 'Welcome to the server!');

  // Example: Listen for messages from the client
  socket.on('new-message', (data) => {
      console.log('Message from client:', data);

      createMessage(data);

      // Example: Broadcast the received message to all clients
      io.emit('rcvd-message', data);
  });


  socket.on('typingStatuss', ({ UserName, isTyping }) => {
    // Store typing status in Redis
    const key = `typing:${UserName}`;
    // if (isTyping) {
    //   redisClient.set(key, 'true');
    // } else {
    //   redisClient.del(key);
    // }

    console.log("typing");

    // Broadcast typing status to other connected clients
    io.emit('typingStatus', { UserName, isTyping });
  });


  // Example: Listen for disconnect events
  socket.on('disconnect', () => {
      console.log('A client disconnected');
  });

});




mongoose
  .connect("mongodb://rohitssingh17:Seeyouagain11!@ac-lo7eev6-shard-00-00.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-01.xo7hitn.mongodb.net:27017,ac-lo7eev6-shard-00-02.xo7hitn.mongodb.net:27017/?ssl=true&replicaSet=atlas-4oinm6-shard-0&authSource=admin&retryWrites=true&w=majority")
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => {
    console.log("Connection failed", e.message);
  });

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

  console.log(`listening on port ${port}`);
});



















