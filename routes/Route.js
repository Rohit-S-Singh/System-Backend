import express from 'express';
import {LoginUser, RegisterUser, OauthCallbackHandler, CheckEmailConnection, sendEmail } from '../controller/auth.js';
import { getAllUsers, getChat, sendMessage, createGroup, getAllGroups, sendGroupMessage, getGroupChat , deleteMessageFromMe , deleteGroup } from '../controller/chat.js';
import authenticateToken from '../middleware/index.js';
const Router = express.Router();


Router.get('/health-check',  (req, res) => {
    console.log("ascsa");
    res.json({ status: 200, message: "Server is working" });
});
Router.post('/login',  LoginUser)
Router.post('/register', RegisterUser)
Router.get('/oauth2/callback', OauthCallbackHandler)
Router.post('/check-email-connection',CheckEmailConnection );

Router.post("/send-email", sendEmail)

Router.get('/get-all-users' , authenticateToken ,  getAllUsers)



Router.get('/get-user-chat', authenticateToken ,getChat)
Router.post('/send-user-message', sendMessage)
Router.post('/create-group', authenticateToken, createGroup)
Router.get('/get-user-group',authenticateToken, getAllGroups)
Router.post('/send-group-message',authenticateToken , sendGroupMessage)
Router.get('/get-group-chat',authenticateToken, getGroupChat)
Router.delete('/delete-group' , authenticateToken, deleteGroup )
Router.delete('/delete-group-message-from-me' , authenticateToken , deleteMessageFromMe)


Router.use('*', (req, res) => {
    res.status(404).json({ error: "Requested Endpoint not Found !" })
})

export default Router;
