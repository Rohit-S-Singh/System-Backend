const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

const passport = require("passport");

// const   authenticate } from 'passport';

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const passport = require('passport');

// const auth = require('../../middleware/auth');

// Bring in Models & Helpers
const User = require("../models/user");
const { application } = require("express");
const { reset } = require("nodemon");
// const mailchimp = require('../../services/mailchimp');
// const nodemailer = require('../../services/nodemailer');

// const keys = require('../../config/keys');

// const { secret, tokenLife } = keys.jwt;
// app.post(
//   "/login",
//   passport.authenticate("local", {
//     successRedirect: "/",
//     failureRedirect: "/login",
//   })
// );

router.post(
  "/login",
  // passport.authenticate("local", {
  //   //  successRedirect: "/",
  //   failureRedirect: "/notfound",
  // }),
  (req, res) => {
    console.log('abcd');
    // const email = req.body.email;
    // const password = req.body.password;
    // console.log("gbfbf", req.user);

    // if (req.user == null) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Incorrect Password or email please try again.",
    //   });
    // } else {
      return res.status(200).json({
        success: true,
        // token: `Bearer ${token}`,
        user: {},
      });
    // }
  }
);

// app.get("/user",(req,res)=>{
//   res.send(req.user);
// })

// // verify email of registered user
// router.get('/verify/:id', (req,res)=>{

//   User.findOneAndUpdate({_id:req.params.id} , {isverified:true} , (err,data)=>{
//     if(err){
//       res.status(400).json({error: 'Could not find User.'})
//     }
//     else{
//       var link = process.env.BASE_CLIENT_URL + "/verified"
//       res.redirect(link);
//     }
//   })
// })

// // Resending Email for Verification
// router.get('/resendVerificationMail/:email',(req,res)=>{

//   User.findOne({email: req.params.email}, async function(err, doc) {

//     if(err ||doc==null){
//        res.status(400).json({'message':'Email not Registered.'});
//     }

//     else if(doc.isverified==true){
//       res.status(200).json({'message':'Email Already Verified.'})
//     }
//     else{
//       var id;
//       id = doc._id;
//       var link = process.env.BASE_SERVER_URL + `/api/auth/verify/${id}`;

//     const name = doc.firstName + " " + doc.lastName;

//     var data = {
//       name,
//       link
//     }

//       await nodemailer.sendEmail(req.params.email,'resend-verify-email','',data);

//       res.status(200).json({
//         'message':'mail has been sent',
//       })
//   }});
// });

router.post("/register", async (req, res) => {

  try {
    console.log("abcd", req.body);
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    if (!email) {
      return res.status(400).json({ error: "You must enter an email address." });
    }

    if (!password) {
      return res.status(400).json({ error: "You must enter a password." });
    }

    const user = new User({
      email,
      password,
      name,
    });

    const savedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Account Created Successfully",
      user: savedUser,
    });
    // user.save();
    // async (err, user) => {
    //   if (err) {
    //     console.log(err);
    //     return res.status(400).json({
    //       error: "Your request could not be processed. Please try again.",
    //     });
    //   }

    //   const payload = {
    //     id: user.id,
    //   };

    //   return res.status(200).json({
    //     success: true,
    //     message: "Account Created Sucessfully",
    //   });
    // });

    // console.log(resp);

    const us = await User.findOne({ email });

    console.log(us);

    // User.findOne({ email }, async (err, existingUser) => {
    //   if (err) {
    //     console.log(err);
    //     return;
    //     // next(err);
    //   }

    //   if (existingUser) {
    //     return res
    //       .status(400)
    //       .json({ error: "That email address is already in use." });
    //   }

    //   const user = new User({
    //     email,
    //     password,
    //     name,
    //   });

    //   bcrypt.genSalt(10, (err, salt) => {
    //     bcrypt.hash(user.password, salt, (err, hash) => {
    //       if (err) {
    //         return res.status(400).json({
    //           error: "Your request could not be processed. Please try again.",
    //         });
    //       }
    //       console.log("ewfwevewvwevwe");
    //       user.password = hash;

    //       user.save(async (err, user) => {
    //         if (err) {
    //           console.log(err);
    //           return res.status(400).json({
    //             error: "Your request could not be processed. Please try again.",
    //           });
    //         }

    //         const payload = {
    //           id: user.id,
    //         };

    //         res.status(200).json({
    //           success: true,
    //           message: "Account Created Sucessfully",
    //         });
    //       });
    //     });
    //   });
    // });

  }
  catch (err) {
    console.log(err);
  }

});
module.exports = router;
