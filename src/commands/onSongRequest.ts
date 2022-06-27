import { addToQueue, extractSpotifyUrl, getMusicName } from "../interfaces/Spotify";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const moment = require('moment-timezone');

/**
 * Function called when user requests to add a song to Spotify Queue
 * 
 * @param {number}      userId          ID of the user who requested the song
 * @param {string}      username        Username of the user who requested the song
 * @param {string}      trackId         ID of the song requested
 * @param {string}      origin          Origin of the song request 
 * 
 * @returns {Promise<any>}
 */
export async function onSongRequest(userId: number, username: string, trackId: string, origin: string): Promise<any> {

    const response = {
        message: "",
        errorMsg: "",
    };

    if (!trackId) {
        response.message = `${username}, formatos de link aceitos: https://open.spotify.com/track/6EThJr4Dq1Y93JspecGU2F?si=a96ffecc0b984a2a ou spotify:track:6EThJr4Dq1Y93JspecGU2F`;
        return response;
    }

    try {

        const getOnlyTrackId = extractSpotifyUrl(trackId, true);
        let modifiableTrackId = "";

        if (trackId.startsWith("spotify:track:")) {
            modifiableTrackId = trackId;
        } else if (trackId.startsWith("https://open.spotify.com/track/")) {
            modifiableTrackId = extractSpotifyUrl(trackId);
        } else {
            response.message = `${username}, formatos de link aceitos: https://open.spotify.com/track/6EThJr4Dq1Y93JspecGU2F?si=8e891f350a114472 ou spotify:track:6EThJr4Dq1Y93JspecGU2F`;
            response.errorMsg = "refuse_redemption";

            return response;
        }

        let musicName = await getMusicName(getOnlyTrackId);
        console.log("🔎 Received music name: " + musicName);

        if (musicName == "new_token") {
            console.log("🔂 Recalling onSongRequest() function after receiving a new Spotify token ...");
            return await onSongRequest(userId, username, trackId, origin);
        } else if (musicName == "") {
            response.message = `${username}, não consegui encontrar a música que você solicitou. Verifique o link e tente novamente!`;
            response.errorMsg = "refuse_redemption"

            return response;
        }

        if (!process.env.TWITCH_REQUEST_SPOTIFY_REWARD_ID) return;
        const rewardId = process.env.TWITCH_REQUEST_SPOTIFY_REWARD_ID;

        if (origin != "test") {

            await prisma.userRedemption.create({
                data: {
                    user_id: userId,
                    reward_id: rewardId,
                    points_spent: 1,
                    created_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                }
            });

            await prisma.livePlaylist.create({
                data: {
                    user_id: userId,
                    track_id: getOnlyTrackId,
                    track_name: musicName ? musicName : "",
                    created_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                }
            });

            console.log(`🎵 ${username} pediu a música "${musicName}"`);
        }

        await addToQueue(modifiableTrackId).then(data => {
            response.message = `${username} adicionou a música "${musicName}" na fila!`;
        }).catch(error => {
            response.message = `${username}, erro ao tentar adicionar sua música na fila!`;
        })

        return response;

    } catch (error) {
        console.log(error);
    }

}