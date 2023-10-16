const express = require("express");
const router = express.Router();

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const passport = require('passport');

// const auth = require('../../middleware/auth');

// Bring in Models & Helpers
const User = require("../models/user");
// const mailchimp = require('../../services/mailchimp');
// const nodemailer = require('../../services/nodemailer');

// const keys = require('../../config/keys');

// const { secret, tokenLife } = keys.jwt;

// router.post('/login', (req, res) => {
//   const email = req.body.email;
//   const password = req.body.password;

//   if (!email) {
//     return res.status(400).json({ error: 'You must enter an email address.' });
//   }

//   if (!password) {
//     return res.status(400).json({ error: 'You must enter a password.' });
//   }

//   User.findOne({ email }).then(user => {
//     if (!user) {
//       return res
//         .status(400)
//         .send({ error: 'No user found for this email address.' });
//     }

//     if (!user) {
//       return res
//         .status(400)
//         .send({ error: 'No user found for this email address.' });
//     }

//     // if(!user.isverified){
//     //   return res
//     //   .status(400)
//     //   .send({ error: 'Please Verify your account.'});
//     // }

//     bcrypt.compare(password, user.password).then(isMatch => {
//       if (isMatch) {
//         const payload = {
//           id: user.id
//         };

//         jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
//           res.status(200).json({
//             success: true,
//             token: `Bearer ${token}`,
//             user: {
//               id: user.id,
//               firstName: user.firstName,
//               lastName: user.lastName,
//               email: user.email,
//               role: user.role
//             }
//           });
//         });
//       } else {
//         res.status(400).json({
//           success: false,
//           error: 'Password Incorrect'
//         });
//       }
//     });
//   });
// });

// // verify email of registered user
router.get("/addRatings/:id", (req, res) => {
  console.log("Hello World");

  res.status(200).json({
    success: true,
    message: "Account Created Sucessfully",
    //   email:user.email,
    //               name:user.firstName+" "+user.lastName
  });
});

router.get("/", (req, res) => {
  console.log("Hello World");

  res.status(200).json({
    success: true,
    message: "Coming here",
    //   email:user.email,
    //               name:user.firstName+" "+user.lastName
  });
});

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

router.post("/register", (req, res) => {
  console.log("abcd", req.body);
  const email = req.body.email;
  const Name = req.body.name;
  //   const lastName = req.body.lastName;
  const password = req.body.password;
  //   const isSubscribed = req.body.isSubscribed;

  if (!email) {
    return res.status(400).json({ error: "You must enter an email address." });
  }

  //   if (!firstName || !lastName) {
  //     return res.status(400).json({ error: 'You must enter your full name.' });
  //   }

  if (!password) {
    return res.status(400).json({ error: "You must enter a password." });
  }

  User.findOne({ email }, async (err, existingUser) => {
    if (err) {
      next(err);
    }

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "That email address is already in use." });
    }

    //     let subscribed = false;
    //     if (isSubscribed) {
    //       const result = await nodemailer.subscribeToNewsletter(email);

    //       if (result.status === 'subscribed') {
    //         subscribed = true;
    //       }
    //     }

    const user = new User({
      email,
      password,
      Name,
      //       lastName
    });

    //     bcrypt.genSalt(10, (err, salt) => {
    //       bcrypt.hash(user.password, salt, (err, hash) => {
    //         if (err) {
    //           return res.status(400).json({
    //             error: 'Your request could not be processed. Please try again.'
    //           });
    //         }

    //         user.password = hash;

    user.save(async (err, user) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          error: "Your request could not be processed. Please try again.",
        });
      }

      const payload = {
        id: user.id,
      };

      //           var link = process.env.BASE_SERVER_URL + `/api/auth/verify/${user._id}`
      //           var data = {
      //             "firstName":user.firstName,
      //             "lastName":user.lastName,
      //             "link":link
      //           }

      //           await nodemailer.sendEmail(user.email,'signup-authentication','',data)

      res.status(200).json({
        success: true,
        message: "Account Created Sucessfully",
        //   email:user.email,
        //               name:user.firstName+" "+user.lastName
      });
    });
  });
  //     });
  //   });
});

module.exports = router;
