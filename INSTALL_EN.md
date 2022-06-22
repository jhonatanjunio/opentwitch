# 🇺🇸 Installation

## Initial Settings

First of all, run the following command to install all dependencies.

```bash
yarn
# OR
npm i
```

After renaming the `.env.example` file to just `.env`, change (initially) the variable referring to the database. The other variables will be changed throughout this guide.

```env
DATABASE_URL="mysql://{DATABASE USER}:{DATABASE PASSWORD}@{DATABASE ADDRESS}/{DATABASE NAME}"
```

Initialize the database with the following command:

```bash
npx prisma init
```

Migrate the model tables to the database (there are two ways to do this)

```bash
npx prisma db push
# OR
npx prisma migrate dev --name="migration name"
```

Initial settings done! Now for the integrations.

## Integrating with Twitch chat

It is recommended that you create an account for your Bot. You can use your main account, it will just look like it's you responding to all commands sent by users (might seem weird...). We usually create an account with the name of channel + bot. Feel free.
**IMPORTANT**: if you are going to use your account to respond to commands, the following process only needs to be done once. If you are going to use a 'bot' account, you will need to do the following process on the 'bot' account and on your main account as well.

- Logged in with the account you will use as the person responsible for responding to commands, access the Twitch API dashboard through [this link](https://dev.twitch.tv/console).
- Click on the Apps tab, then click on "+ Register your app"
- Give your app whatever name you want (must be unique across the platform, so be creative) In the "OAuth redirect URL" field, type http://localhost:3003 and under Category, choose Chat Bot and then click Create.
- Your app will now be in the apps list. Click on the Manage button. On the screen that displays your app's information, click "New Secret". Now you need to copy the Client ID and Client Secret.

Now you need to generate the "code" necessary for our application to work. For this, access the link: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id={PUT THE CLIENT ID COPIED PREVIOUSLY HERE}&redirect_uri=http://localhost:3003&scope=chat:read+chat:edit+channel:read:redemptions&token_type=bearer`<br/>
The return will be "your code is: {your code}".
<br/><br/>

Now you have 3 pieces of information (I hope so):

- Client ID<br/>
- Client Secret<br/>
- Code<br/>
  
<br/>

Open the `.env` file located at the project root and replace the following information:

```env
TWITCH_BOT_USERNAME="account name used as your command responder, example: oninjabot"
TWITCH_OAUTH="oauth:pvsv0uwo81db0663qsn1btg4vvkuiy"
TWITCH_CHANNEL="name of your channel, example: oninjadev"

BOT_TWITCH_CLIENT_ID="put here the client id of the account responsible for responding to commands"
BOT_TWITCH_SECRET="put here the client secret of the account responsible for responding to commands"

TWITCH_CLIENT_ID="enter your main account client id here"
TWITCH_SECRET="enter your main account's client secret here"
```

<br/><br/>

Now you will need to generate your access token and refresh token. For that you will need to make a POST call to the url https://id.twitch.tv/oauth2/token .
I used Postman! Leave the "grant_type" fields as authorization_code and "redirect_uri" as http://localhost:3003 . We are talking about an http POST call with GET parameters. If you are following the convention and have created a bot account, you will have to make two calls like the one below, filling in the keys according to the two accounts (the main and the bot account)

![Postman configs](/resources/postman%20config.png?raw=true")

The return of this call **should** be something like:
```json
{
    "access_token": "generated access token",
    "expires_in": 13477,
    "refresh_token": "generated refresh token",
    "scope": [
        "channel:read:redemptions",
        "chat:edit",
        "chat:read"
    ],
    "token_type": "bearer"
}
```

You must adapt the result of the JSON files to the corresponding files. The files are located in the `src/jsons` folder. They are: twitch_main_tokens.json which corresponds to the JSON result of your main account (streamer account) and twitch_bot_tokens.json which corresponds to the JSON result of the account that will respond to the commands of the chat users. The file **must** have the following structure:

```json
{
    "accessToken": "paste the generated access token here",
    "refreshToken": "paste the generated refresh token here",
    "scope": [
        "channel:read:redemptions",
        "chat:edit",
        "chat:read"
    ],
    "expiresIn": 13748,
    "obtainmentTimestamp": 0
}
```

Done! The bot is already working in your chat. Test by opening your chat and running the command `!playsound wow`

## Integrating with Spotify

**IMPORTANT**: You must have a Spotify Premium account. If you are not a premium user, you'll get this API return:<br/>

```json
{
  "error": {
    "status": 403,
    "message": "Player command failed: Premium required",
    "reason": "PREMIUM_REQUIRED"
  }
}
```

Create or login with your **Spotify for Developers** account at [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and then click `CREATE AN APP`. Fill in all the fields and after creating the APP, copy the `CLIENT ID`, click on `SHOW CLIENT SECRET` and then copy the Client Secret. Paste this information into your .env file located at the root of the project. You also need to click `EDIT SETTINGS` to set the `REDIRECT URI` to our localhost. Put: `http://localhost:3003/spotify/callback`

To get the DEVICE ID ('place' where your songs are listened to. It can be the browser, the Spotify app, etc) access the link: [https://developer.spotify.com/console/get-users-available-devices/](https://developer.spotify.com/console/get-users-available-devices/), click `GET TOKEN` and check the `user-read-playback-state` authorization. Accept the terms if you have not yet authorized Spotify for Developers: Console. With the OAuth Token generated, click on `TRY IT` and see the result on the right side of the result. Copy the `id` and paste in your .env file in the `SPOTIFY_DEVICE_ID` variable

At the end of the steps above, it is expected that your .env file will also have the following variables:

```env
#.env
SPOTIFY_DEVICE_ID="paste your device id here"
SPOTIFY_CLIENT_ID="paste your client id here"
SPOTIFY_CLIENT_SECRET="paste your client secret here"
```

The next step is to generate the necessary tokens to use the Spotify integration. For that you need to run our application. Open your command console and, from the project root, run the `index.ts` file. I use `yarn` so the command I use is `yarn dev`. If you use `NPM` it will obviously be `npm run dev` and so on. The result in your terminal should be as follows:

```bash
🚀 Backend started and listening at: http://127.0.0.1:3003
🤖 Bot connected to chat
```

After that, open your browser and access [http://127.0.0.1:3003/generate-grant-code](http://127.0.0.1:3003/generate-grant-code) to generate the `grant code` of Spotify. Doing so will return `A new tab will open with the Spotify grant code`. You will be asked to access the application you created and after you allow it, you will be redirected to `http://127.0.0.1:3003/spotify/callback`, where you will receive your Spotify `code`. Copy this information (available in the body of the page or in the URL) and paste the result in the file `src/jsons/spotify_grant_code.json` , looking like this:

```json
{
    "code": "paste your received code here"
}
```

Now go to [http://127.0.0.1:3003/generate-tokens](http://127.0.0.1:3003/generate-tokens) and ALL SET! You are now ready to use the Spotify integration too!<br/>

**WARNING** Every time you start the live, use the `!livestart` command to start the playlist correctly, preventing songs requested in earlier dates from appearing in the `!songlist` command. <br/><br/>

Enjoy! <br/><br/>
##### Made with 💜 by [Jhonatan](https://github.com/jhonatanjunio) and [oNinjaDev Community](https://twitch.tv/oninjadev)
