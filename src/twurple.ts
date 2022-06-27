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
import { commandsRouter } from "./commands/commandsRouter";
import { ApiClient } from "@twurple/api";

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
                const getUser = await this.getProfile(user, userIsSubscriber);
                const userIsAdmin = getUser.is_admin;

                const args = message.slice(1).split(' ');
                const command = args.shift().toLowerCase();

                // To TEST !
                // if (commandsRouter.filter((command: any) => command.aliases.includes(command)).length > 0) {
                //     const commandToExecute = commandsRouter.filter((command: any) => command.aliases.includes(command))[0];
                //     if (commandToExecute.permissions.includes("admin") && !userIsAdmin) {
                //         this.sendChatMessage(`${user}, você não tem permissão para executar este comando!`);
                //         return;
                //     } else {
                //         const commandName = commandToExecute.name;
                //         const commandPath = `./commands/${commandToExecute.file}`;

                //         import(commandPath).then(command => {
                //             //pass parameters according to the command params length
                //             const commandToExecute = command.file;
                //             const commandParams = command.params;
                //             if (commandParams.length > 0) {
                //                 const commandParamsToExecute = commandParams.map((param: any, index: number) => {
                //                     return args[index];
                //                 }).filter((param: any) => param);
                //                 commandToExecute(...commandParamsToExecute);
                //             } else {
                //                 commandToExecute();
                //             }

                //         }).catch(err => {
                //             console.log(`❌ Error while importing command: ${commandName}`);
                //             console.log(err);
                //         });
                //     }
                // } else {                    
                //     this.sendChatMessage(`${user}, comando não encontrado!`);
                // }                

                //Responding to commands
                switch (command) {

                    //Spotify Calls
                    case "songrequest":
                    case "sr":
                        if (args.length) {
                            this.onSongRequest(getUser.id, user, args[0], "chat");
                        } else {
                            chatClient.say(channel, `${user}, formatos de link aceitos: https://open.spotify.com/track/6EThJr4Dq1Y93JspecGU2F?si=a96ffecc0b984a2a ou spotify:track:6EThJr4Dq1Y93JspecGU2F`);
                        }
                        break;

                    case "songlist":
                    case "sl":
                        this.onSongList(getUser.id);
                        break;

                    case "voteskip":
                    case "voteyes":
                    case "vs":
                        this.onVoteSkip(getUser.id, user, "skip");
                        break;

                    case "votekeep":
                    case "voteno":
                    case "vn":
                    case "vk":
                        this.onVoteSkip(getUser.id, user, "keep");
                        break;

                    //Sound player
                    case "playsound":
                    case "ps":
                        if (args.length) {
                            this.onSoundRequest(getUser.id, user, args[0]);
                        } else {
                            chatClient.say(channel, `${user}, você precisa escolher um som! Sons disponíveis: ${availableSounds.join(", ")}`);
                        }
                        break;

                    //General
                    case "help":
                        chatClient.say(channel, `${user}, comandos disponíveis: ${commandsRouter.map(c => `${c.name} → ${c.description}`).join(" | ")}`);
                        break;

                    //Admin calls
                    case "livestart":
                        if (userIsAdmin) this.onLiveStart();
                        else chatClient.say(channel, `${user}, você não tem permissão para executar esse comando!`);
                        break;

                    //Socials and links
                    case "socials":
                        chatClient.say(channel, `${user}, links sociais: ${availableSocials.map(s => `${s.name}`).join(" | ")}`);
                        break;
                    case "linkedin":
                        const linkedin = availableSocials.filter(s => s.name == "!linkedin")[0];
                        chatClient.say(channel, `${user}, ${linkedin.description}`);
                        break;
                    case "github":
                        const github = availableSocials.filter(s => s.name == "!github")[0];
                        chatClient.say(channel, `${user}, ${github.description}`);                        
                        break;
                    case "discord":
                        const discord = availableSocials.filter(s => s.name == "!discord")[0];
                        chatClient.say(channel, `${user}, ${discord.description}`);
                        break;
                    case "twitter":
                        const twitter = availableSocials.filter(s => s.name == "!twitter")[0];
                        chatClient.say(channel, `${user}, ${twitter.description}`);
                        break;
                    case "instagram":
                        const instagram = availableSocials.filter(s => s.name == "!instagram")[0];
                        chatClient.say(channel, `${user}, ${instagram.description}`);
                        break;

                    default:
                        chatClient.say(channel, `${user}, comando não reconhecido!`);
                        break;
                }

            });
        } catch (e) {
            console.error(e);
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

    // Function invoked when user redeems something at the livestream store
    private async onRedemptionMessage(event: PubSubRedemptionMessage) {
        const { id, channelId, rewardCost, userName, rewardId, message } = event;

        const profile = await this.getProfile(userName);
        let successfulRedemption = false;

        if (rewardId == process.env.TWITCH_REQUEST_SPOTIFY_REWARD_ID) {

            await this.onSongRequest(profile.id, userName, message, "store").then(async (songRequest) => {
                if (songRequest == "refuse_redemption") {
                    // giving user points back
                    this.apiClient.channelPoints.updateRedemptionStatusByIds(channelId, rewardId, [id], "CANCELED");
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

    // Function called when the livestream starts (required)
    private async onLiveStart() {

        //Create livePlaylist start entry
        const checkLiveStartedToday = await prisma.livePlaylist.count({
            where: {
                created_at: {
                    gte: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD 00:00:00"))
                },
                track_id: "LIVE START"
            }
        });

        if (checkLiveStartedToday == 0) {

            //Refresh spotify token
            await refreshToken();
            //end refresh spotify token

            const liveStarted = await prisma.livePlaylist.create({
                data: {
                    user_id: 0,
                    track_id: "LIVE START",
                    track_name: `START DATE: ${moment().tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm")}`,
                    created_at: new Date(moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'))
                }
            });

            //Write live params
            let liveParams: any = fs.readFile('./src/jsons/live_params.json', 'utf8');
            liveParams = JSON.parse(await liveParams) as Array<any>;
            liveParams.live_playlist_id = liveStarted.id;
            liveParams.start_date = liveStarted.created_at;
            
            fs.writeFile('./src/jsons/live_params.json', JSON.stringify(liveParams));
            //end write live params
            

            console.log("🚀 Live iniciada! Boa live!!!");
        } else {
            console.log("🤔 Acho que você restartou o serviço do bot!");
        }
        //end create livePlaylist start entry
    }

    // Function called to check if the user is already in the database
    private async getProfile(username: string, isSubscriber: string = "false") {

        const findUserByUserName = await prisma.user.findMany({
            where: {
                username: username
            }
        });

        if (!findUserByUserName.length) {
            const user = await prisma.user.create({
                data: {
                    username: username,
                    is_subscriber: isSubscriber,
                    is_admin: username == process.env.TWITCH_CHANNEL ? "true" : "false"
                }
            });
            return user;
        }

        await prisma.user.update({
            where: {
                id: findUserByUserName[0].id
            },
            data: {
                is_subscriber: isSubscriber
            }
        });

        return findUserByUserName[0];
    }

    // Function to play a sound. See the sound files in the ./src/sounds folder
    async onSoundRequest(userId: number, username: string, sound: string) {
        try {
            if (availableSounds.includes(sound)) {
                await soundplayer.play(path.join(__dirname, `/sounds/${sound}.mp3`), 1);
            } else {
                this.sendChatMessage(`${username}, o som que você pediu não foi encontrado!`);
            }
        } catch (error) {
            console.log(error);
        }
    }

    // Function called when user requests a song
    async onSongRequest(userId: number, username: string, trackId: string, origin: string) {

        try {

            const getOnlyTrackId = extractSpotifyUrl(trackId, true);

            if (trackId.startsWith("spotify:track:")) {
                trackId = trackId;
            } else if (trackId.startsWith("https://open.spotify.com/track/")) {
                trackId = extractSpotifyUrl(trackId);
            } else {
                this.sendChatMessage(`${username}, formatos de link aceitos: https://open.spotify.com/track/6EThJr4Dq1Y93JspecGU2F?si=8e891f350a114472 ou spotify:track:6EThJr4Dq1Y93JspecGU2F`);
                
                if (origin == "store") return "refuse_redemption";

                return;
            }

            let musicName = await getMusicName(getOnlyTrackId);

            if (musicName == "new_token") {
                this.onSongRequest(userId, username, trackId, origin);
                return;
            } else if (!musicName) {
                this.sendChatMessage(`${username}, não consegui encontrar a música que você solicitou. Verifique o link e tente novamente!`);

                if (origin == "store") return "refuse_redemption";
                return;
            }

            if (!process.env.TWITCH_REQUEST_SPOTIFY_REWARD_ID) return;
            const rewardId = process.env.TWITCH_REQUEST_SPOTIFY_REWARD_ID;

            await prisma.userRedemption.create({
                data: {
                    user_id: userId,
                    reward_id: rewardId,
                    points_spent: 1,
                    created_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                }
            });


            await addToQueue(trackId).then(async data => {
                this.sendChatMessage(`${username} adicionou a música "${musicName}" na fila!`);
                console.log(`🎵 ${username} pediu a música "${musicName}"`);

                await prisma.livePlaylist.create({
                    data: {
                        user_id: userId,
                        track_id: getOnlyTrackId,
                        track_name: musicName ? musicName : "",
                        created_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                    }
                });
            }).catch(error => {
                console.log(error.response.data);
                this.sendChatMessage(`${username}, erro ao tentar adicionar sua música na fila!`);
            })
        } catch (error) {
            console.log(error);
        }

    }

    // Function called when user wants to know the current song
    async getCurrentPlayingSong() {

        try {

            let getCurrentPlayingTrackId = await currentPlayingTrackId();
            if (getCurrentPlayingTrackId == "new_token") {
                this.getCurrentPlayingSong();
                return;
            }

            if (!getCurrentPlayingTrackId) {
                this.sendChatMessage(`🤔 Nenhuma música está tocando no momento!`);
                return;
            }

            const getLivePlaylistId = JSON.parse(await fs.readFile("./src/jsons/live_params.json", "utf-8"));

            const currentlyPlayingTrack = await prisma.livePlaylist.findMany({
                where: {
                    track_id: getCurrentPlayingTrackId,
                    id: {
                        gte: getLivePlaylistId.live_playlist_id,
                    }
                },
                include: {
                    user: true
                },
            });

            if (!currentlyPlayingTrack[0] || !currentlyPlayingTrack[0].id) {
                this.sendChatMessage(`🤔 A música que está tocando agora não está na playlist! Peça uma música usando !songrequest`);
                return;
            }

            const currentTrack = currentlyPlayingTrack[0];
            this.sendChatMessage(`🎵 Tocando agora: "${currentTrack.track_name}" adicionada por ${(currentTrack.user ? "@" + currentTrack.user.username : "usuário desconhecido")}`);

        } catch (error) {
            console.log(error)
        }
    }

    // Function used to show current playing track and the next 3 tracks in queue
    async onSongList(userId: number) {

        try {

            let getCurrentPlayingTrackId = await currentPlayingTrackId();
            if (getCurrentPlayingTrackId == "new_token") {
                this.onSongList(userId);
                return;
            }

            if (!getCurrentPlayingTrackId) {
                this.sendChatMessage(`🤔 Nenhuma música está tocando no momento!`);
                return;
            }

            const getLivePlaylistId = JSON.parse(await fs.readFile("./src/jsons/live_params.json", "utf-8"));

            const currentlyPlayingTrack = await prisma.livePlaylist.findMany({
                where: {
                    track_id: getCurrentPlayingTrackId,
                    id: {
                        gte: getLivePlaylistId.live_playlist_id,
                    }
                },
                include: {
                    user: true
                },
            });

            if (!currentlyPlayingTrack[0] || !currentlyPlayingTrack[0].id) {
                this.sendChatMessage(`🤔 A música que está tocando agora não está na playlist! Peça uma música usando !songrequest`);
                return;
            }

            const currentTrack = currentlyPlayingTrack[0];

            const countTracksInQueue = await prisma.livePlaylist.count({
                where: {
                    id: {
                        gt: currentTrack.id
                    }
                }
            });

            if (countTracksInQueue == 0) {
                this.sendChatMessage(`🤔 A playlist está vazia! Peça uma música usando !songrequest`);
                return;
            }

            const nextTracksInQueue = await prisma.livePlaylist.findMany({
                where: {
                    id: {
                        gt: currentTrack.id
                    },
                    created_at: {
                        gte: currentTrack.created_at ? currentTrack.created_at : new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD 00:00:00"))
                    }
                },
                orderBy: {
                    created_at: "asc"
                },
                include: {
                    user: true
                }
            });

            const findUserMusicInQueue = await prisma.livePlaylist.findMany({
                where: {
                    user_id: userId,
                    id: {
                        gte: getLivePlaylistId.live_playlist_id,
                    }
                },
                include: {
                    user: true
                }
            });
            
            const nextTracks = nextTracksInQueue.slice(0, 3);
            this.sendChatMessage(`🎵 Tocando agora: "${currentTrack.track_name}" adicionada por ${(currentTrack.user ? "@" + currentTrack.user.username : "usuário desconhecido")}`);

            //list next tracks with index
            let nextTracksList = "";
            let userTrackIsNext = false;
            for (let i = 0; i < nextTracks.length; i++) {
                nextTracksList += `${i + 1}. "${nextTracks[i].track_name}" adicionada por ${(nextTracks[i].user ? "@" + nextTracks[i].user.username : "usuário desconhecido")}`;
                if (i < nextTracks.length - 1) {
                    nextTracksList += " | ";
                }
                if (nextTracks[i].user_id == userId) {
                    userTrackIsNext = true;
                }
            }

            //get user position in queue based in index
            let userPositionInQueue = 0;
            for (let i = 0; i < nextTracksInQueue.length; i++) {
                if (nextTracks[i] && nextTracks[i].user_id == userId) {
                    userPositionInQueue = i + 1;
                }
            }

            // if (findUserMusicInQueue != null && findUserMusicInQueue[0] != null && userTrackIsNext == false && userId == findUserMusicInQueue[0].user_id) {
            //     nextTracksList = nextTracksList + `... sua música está na posição ${userPositionInQueue}. da fila!`;
            // }

            this.sendChatMessage(`⏳ Próximas músicas na fila: ${nextTracksList}`);
        } catch (error) {
            console.log(error);

        }
    }

    // Function to calculate skip and keep votes
    async onVoteSkip(userId: number, username: string, vote: string) {
        try {

            const getCurrentPlayingTrackId = await currentPlayingTrackId();
            const maxVotes = Number(String(process.env.SONG_MAX_SKIP_VOTES));
            
            // check if token is still available
            if (getCurrentPlayingTrackId == "new_token") {
                this.onVoteSkip(userId, username, vote);
                return;
            }

            if (!getCurrentPlayingTrackId) {
                this.sendChatMessage(`🤔 Aparentemente não tem nenhuma música tocando no momento! Peça uma música usando !songrequest`);
                return;
            }

            const currentlyPlayingTrack = await prisma.livePlaylist.findMany({
                where: {
                    track_id: getCurrentPlayingTrackId
                },
                include: {
                    user: true
                }
            });

            if (!currentlyPlayingTrack) {
                this.sendChatMessage(`🤔 A música que está tocando não está na playlist! Peça uma música usando !songrequest`);
                return;
            }

            // check if user has already voted
            const getUserCurrentSkipCount = await prisma.livePlaylistSkipCount.count({
                where: {
                    user_id: userId,
                    live_playlists_id: currentlyPlayingTrack[0].id
                }
            });

            if (getUserCurrentSkipCount > 0) {
                this.sendChatMessage(`@${username}, você já votou! 👍`);
                return;
            } else {

                // get next tracks in queue
                const nextTracksInQueue = await prisma.livePlaylist.findMany({
                    where: {
                        id: {
                            gt: currentlyPlayingTrack[0].id
                        },
                        created_at: {
                            gte: currentlyPlayingTrack[0].created_at ? currentlyPlayingTrack[0].created_at : new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD 00:00:00"))
                        }
                    },
                    orderBy: {
                        created_at: "asc"
                    },
                    include: {
                        user: true
                    }
                }).catch(error => {
                    console.log(error.response.data);
                    console.log("❌ Tudo indica que não há músicas na fila após a música atual!");
                });

                const nextTrack = nextTracksInQueue ? nextTracksInQueue[0] : null;

                // increment skip count for current user, avoind multiple votes
                await prisma.livePlaylistSkipCount.create({
                    data: {
                        user_id: userId,
                        live_playlists_id: currentlyPlayingTrack[0].id
                    }
                });

                if (vote == "skip") {

                    // increment skip count for the current playing track
                    await prisma.livePlaylist.update({
                        where: {
                            id: currentlyPlayingTrack[0].id
                        },
                        data: {
                            skip_count: currentlyPlayingTrack[0].skip_count + 1,
                            updated_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                        }
                    });
                    
                    // if votes greater or equals skip count, skip track
                    if ((currentlyPlayingTrack[0].skip_count + 1) >= maxVotes) {

                        this.sendChatMessage(`👍 O povo pediu e a música foi pulada!`);

                        await skipTrack();

                        if (nextTrack) {
                            this.sendChatMessage(`⏩ Próxima música (tocando agora): "${nextTrack.track_name}" adicionada por ${(nextTrack.user ? "@" + nextTrack.user.username : "usuário desconhecido")}`);
                        } else {
                            this.sendChatMessage(`🤔 Não tem mais músicas na playlist!`);
                        }

                        return;

                    } else this.sendChatMessage(`${username}, seu voto foi computado! 👍 Votos para pular a música: ${currentlyPlayingTrack[0].skip_count + 1}/${maxVotes}`);
                }

                if (vote == "keep") {

                    await prisma.livePlaylist.update({
                        where: {
                            id: currentlyPlayingTrack[0].id
                        },
                        data: {
                            keep_count: currentlyPlayingTrack[0].keep_count + 1,
                            updated_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                        }
                    });

                    if ((currentlyPlayingTrack[0].keep_count + 1) >= maxVotes) {

                        this.sendChatMessage(`👍 O povo pediu e a música foi mantida!`);
                        this.onSongList(userId);
                        return;

                    } else this.sendChatMessage(`${username}, seu voto foi computado! 👍 Votos para manter a música: ${currentlyPlayingTrack[0].keep_count + 1}/${maxVotes}`);
                }

            }

            const currentTrack = currentlyPlayingTrack[0];

            this.sendChatMessage(`🎵 Tocando agora: "${currentTrack.track_name}" adicionada por ${(currentTrack.user ? "@" + currentTrack.user.username : "usuário desconhecido")}`);

        } catch (error) {
            console.log(error);
        }
    }

}