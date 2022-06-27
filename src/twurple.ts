import { config } from "dotenv";
config();
import { PubSubClient, PubSubRedemptionMessage } from "@twurple/pubsub";
import { ChatClient } from '@twurple/chat';
import { RefreshingAuthProvider } from '@twurple/auth';
import { promises as fs } from 'fs';
import { PrismaClient } from '@prisma/client'
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { addToQueue, getMusicName, extractSpotifyUrl, currentPlayingTrackId, refreshToken, skipTrack } from "./interfaces/Spotify";
import { availableSocials, availableSounds } from "./helpers/constants";
const soundplayer = require("sound-play");
const path = require("path");
const moment = require('moment-timezone');
import { callCommand, commandsRouter } from "./commands/commandsRouter";
import { ApiClient } from "@twurple/api";
import { onSongRequest } from "./commands/onSongRequest";
import { getProfile } from "./commands/getProfile";

const prisma = new PrismaClient()

export class TwIntegration {    
    protected isTest?: boolean;
    protected chatClient: ChatClient
    protected apiClient: ApiClient;    

    public constructor(isTest?: boolean) {
        this.isTest = isTest;
    }
    async pubSub() {
        try {
            const clientId = process.env.TWITCH_CLIENT_ID as string;
            const clientSecret = process.env.TWITCH_SECRET as string;          
            const tokenData = JSON.parse(await fs.readFile("./src/jsons/twitch_main_tokens.json", "utf-8"));

            const authProvider = new RefreshingAuthProvider(
                {
                    clientId,
                    clientSecret,
                    onRefresh: async newTokenData => await fs.writeFile('./src/jsons/twitch_main_tokens.json', JSON.stringify(newTokenData, null, 4), "utf-8")
                },
                tokenData
            );

            const pubSubClient = new PubSubClient();
            const userId = await pubSubClient.registerUserListener(authProvider);

            await pubSubClient.onRedemption(userId, this.onRedemptionMessage.bind(this));

            const apiClient = new ApiClient({authProvider: authProvider});
            this.apiClient = apiClient;        
            
        } catch (e) {
            console.error(e);
        }
    }

    // Function called when bot enters the Twitch chat
    async connectChat() {

        try {

            const botClientId = process.env.BOT_TWITCH_CLIENT_ID as string;
            const botClientSecret = process.env.BOT_TWITCH_SECRET as string;
            const botTokenData = JSON.parse(await fs.readFile("./src/jsons/twitch_bot_tokens.json", "utf-8"));
            const botAuthProvider = new RefreshingAuthProvider(
                {
                    clientId: botClientId,
                    clientSecret: botClientSecret,
                    onRefresh: async newTokenData => await fs.writeFile('./src/jsons/twitch_bot_tokens.json', JSON.stringify(newTokenData, null, 4), "utf-8")
                },
                botTokenData
            );

            const chatClient = new ChatClient({ authProvider: botAuthProvider, channels: [process.env.TWITCH_CHANNEL!] });

            this.chatClient = chatClient;

            chatClient.onConnect(() => {
                console.log("🤖 Bot connected to chat");
            });

            chatClient.onDisconnect(() => {
                console.log("⚰️ Bot disconnected from chat");
            });

            await chatClient.connect();

            //Called when user sends a message in the chat
            chatClient.onMessage(async (channel: any, user: any, message: any, msg: TwitchPrivateMessage) => {

                if (user == process.env.TWITCH_BOT_USERNAME || !message.startsWith('!')) return;

                const userIsSubscriber = (msg.userInfo.isSubscriber).toString();
                const getUser = await getProfile(user, userIsSubscriber);
                const userIsAdmin = getUser.is_admin;

                const args = message.slice(1).split(' ');
                const command = args.shift().toLowerCase();

                await callCommand(command, args, userIsAdmin == "true", getUser.id, user)
                    .then(async (result: any) => {
                        this.sendChatMessage(result.message);
                    });

            });
        } catch (e) {
            console.error(e);
        }
    }

    // Function invoked when user redeems something at the livestream store
    private async onRedemptionMessage(event: PubSubRedemptionMessage) {
        const { id, channelId, rewardCost, userName, rewardId, message } = event;

        const profile = await getProfile(userName);
        let successfulRedemption = false;

        if (rewardId == process.env.TWITCH_REQUEST_SPOTIFY_REWARD_ID) {

            await onSongRequest(profile.id, userName, message, "store").then(async (songRequest) => {
                if (songRequest.errorMsg == "refuse_redemption") {
                    this.apiClient.channelPoints.updateRedemptionStatusByIds(channelId, rewardId, [id], "CANCELED");
                    this.sendChatMessage(songRequest.message);
                } else {
                    this.apiClient.channelPoints.updateRedemptionStatusByIds(channelId, rewardId, [id], "FULFILLED");
                    successfulRedemption = true;
                }
            }).catch(async (error) => {
                console.log(error.response.data);
                this.apiClient.channelPoints.updateRedemptionStatusByIds(channelId, rewardId, [id], "CANCELED");
                await this.sendChatMessage(`${userName}, não foi possível adicionar a música na fila!`);
            });

        }

        if (successfulRedemption) {
            // Stores the redemption info in the database
            await prisma.userRedemption.create({
                data: {
                    user_id: profile.id,
                    redemption_id: id,
                    reward_id: rewardId,
                    points_spent: rewardCost
                }
            });
            // You can change "channel points" to whatever you want.
            this.sendChatMessage(`${event.userName} comprou '${event.rewardTitle}' por ${event.rewardCost} pontos de canal!`);
        } else {
            this.sendChatMessage(`${event.userName}, erro ao tentar usar '${event.rewardTitle}'. Seus pontos de canal foram devolvidos.`);
        }

    }

    // Function to send a message in the chat
    async sendChatMessage(message: string) {
        if (this.isTest) {
            console.log(message);
            return;
        }
        return this.chatClient.say(process.env.TWITCH_CHANNEL as string, message);
    }

}