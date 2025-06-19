import User from '../models/User.js'
import { registerSchemaValidation , LoginschemaValidation } from '../validations/index.js';
import pkg from 'bcryptjs';
const { hash , compare } = pkg;
import jwt from 'jsonwebtoken';

import { google } from "googleapis";

export const LoginUser = async (req, res) => {
    const data = req.body;
    const { email, password } = data;
    const { error } = LoginschemaValidation.validate({ email, password });

    if (error) return res.json({ success: false, message: error.details[0].message.replace(/['"]+/g, '') });

    try {
        const checkUser = await User.findOne({ email });
        if (!checkUser) return res.json({ success: false, message: "Account not Found" });

        const isMatch = await compare(password, checkUser.password);
        if (!isMatch) return res.json({ success: false, message: "Incorrect Password" });

        const token = jwt.sign({ id: checkUser._id, email: checkUser.email }, "rohit123$%" ?? 'default_secret_dumbScret', { expiresIn: '1d' });

        // const finalData = {toke n}
        return res.json({"token":token, "username":email})

    } catch (error) {
        console.log("🚀 ~ file: index.js:28 ~ LoginUser ~ error:", error)
        return res.json({ success: false, message: "Something Went Wrong Please Retry Later !" })
    }
}


export const RegisterUser = async (req, res) => {
    const data =  req.body;
    const {name , email , password , phone} = data
    const { error } = registerSchemaValidation.validate( {name , email , password , phone} );

    console.log(data);

    if (error) return res.json({ success: false, message: error.details[0].message.replace(/['"]+/g, '') });

    try {
        const ifExist = await User.findOne({ email });
        
        if (ifExist) {
            return res.json({ success: false, message: "User Already Exist" });
        }

        else {
            const hashedPassword = await hash(password, 12)
            const createUser = await User.create({ email, name, password: hashedPassword , phone });
            if(createUser) return res.json({ success: true, message: "Account created successfully" });
        }
    } catch (error) {
        console.log("🚀 ~ file: index.js:55 ~ RegisterUser ~ error:", error)
        return res.json({ success: false, message: "Something Went Wrong Please Retry Later !" })
    }
}

export const OauthCallbackHandler = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.json({ success: false, message: "Authorization code not provided" });
    }

    try {
        // Prepare URL-encoded params for token exchange
        const params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('code', code);
        params.append('redirect_uri', process.env.REDIRECT_URI);
        params.append('grant_type', 'authorization_code');

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return res.json({
                success: false,
                message: "Failed to exchange authorization code for token",
                error: tokenData,
            });
        }

        const { access_token, refresh_token, expires_in } = tokenData;

        // Fetch user info using access token
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            return res.json({
                success: false,
                message: "Failed to fetch user information",
                error: userData,
            });
        }

        // Check if user already exists in DB
        let user = await User.findOne({ email: userData.email });

        if (!user) {
            user = await User.create({
                name: userData.name,
                email: userData.email,
                oauthProvider: 'google',
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenExpiry: Date.now() + expires_in * 1000, // Store token expiry time
            });
        } else {
            // Update token data for existing user
            user.accessToken = access_token;
            user.refreshToken = refresh_token;
            user.tokenExpiry = Date.now() + expires_in * 1000;
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' }
        );

        return res.json({
            success: true,
            token,
            user: {
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("OauthCallbackHandler error:", error);
        return res.json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

export const sendEmail = async (req, res) => {
    const { to, subject, body, from } = req.body;
  
    try {
      const user = await User.findOne({ email: from });
  
      if (!user || !user.refreshToken) {
        return res.status(401).json({ success: false, message: "Email not connected" });
      }
  
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
      oAuth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
        expiry_date: new Date(user.tokenExpiry).getTime(),
      });
  
      // Automatically refresh token if needed
      oAuth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
          user.refreshToken = tokens.refresh_token;
        }
        if (tokens.access_token) {
          user.accessToken = tokens.access_token;
          user.tokenExpiry = new Date(Date.now() + tokens.expiry_date);
        }
        await user.save();
      });
  
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      const to = "ddaarrkhorse@gmail.com"
  
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        body,
      ].join("\n");
  
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
  
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });
  
      return res.json({ success: true, message: "Email sent successfully" });
  
    } catch (err) {
      console.error("Email sending failed:", err);
      return res.status(500).json({ success: false, message: "Failed to send email" });
    }
  };
  


export const CheckEmailConnection = async (req, res) => {
    const { email, accessToken } = req.body;

    if (!email) {
        return res.json({ success: false, message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email }).lean();

        if (user) {
            if (user?.accessToken) {
                const accessToken = user.accessToken;
                // const isValidToken = jwt.verify(accessToken, process.env.JWT_SECRET || 'default_secret', (err) => !err);
                // if (isVa÷lidToken) {
                    return res.json({ success: true, user, message: "Email is connected to an account with a valid access token" });
                // } else {
                //   ÷  return res.json({ success: false, message: "Invalid access token" });
                // }÷
            }
            return res.json({ success: false, message: "Email is not connected to an account" });
        } else {
            return res.json({ success: false, message: "Email is not connected to any account" });
        }
    } catch (error) {
        console.error("CheckEmailConnection error:", error);
        return res.json({ success: false, message: "Something went wrong. Please try again later." });
    }
};