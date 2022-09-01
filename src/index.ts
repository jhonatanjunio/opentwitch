import { config } from "dotenv";
config();

import express from "express";
import { TwIntegration } from "./twurple";
import { generateCodeGrant, generateTokens } from "./interfaces/Spotify";

const cors = require('cors');

const app  = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Your code is: " + req.query.code);
});

app.get("/spotify/callback", (req, res) => {
    res.send(`Your Spotify grant code is: ${req.query.code} \n\n Paste it into the src/jsons/spotify_grant_code.json file.`);
    res.send("Route for Spotify callback");
});

app.get("/generate-grant-code", (req, res) => {
    generateCodeGrant();
    res.send("A new tab will open with the Spotify grant code");
});

app.get("/generate-tokens", (req, res) => {
    generateTokens();
    res.send("tokens generated");
});

const twintegration = new TwIntegration();

app.listen(port,  () => {
    twintegration.connectChat();
    twintegration.pubSub();
    console.log(`🚀 Backend started and listening at: http://127.0.0.1:${port}`);    
});