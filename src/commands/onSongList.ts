import { currentPlayingTrackId } from "../interfaces/Spotify";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { promises as fs } from 'fs';
const moment = require('moment-timezone');

export const aliases = ["songlist", "sl"];
export async function onSongList(userId: number): Promise<any> {

    const response = {
        message: "",
    };

    try {

        let getCurrentPlayingTrackId = await currentPlayingTrackId();
        console.log("🔎 Received music ID: " + getCurrentPlayingTrackId);

        if (getCurrentPlayingTrackId == "new_token") {
            console.log("🔂 Recalling onSongList() function after receiving a new Spotify token ...");
            return await onSongList(userId);
        } else if (getCurrentPlayingTrackId == "") {
            response.message = `🤔 Nenhuma música está tocando no momento!`;
            return response;
        }

        const getLivePlaylistId = JSON.parse(await fs.readFile("../server/src/jsons/live_params.json", "utf-8"));

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
            response.message = `🤔 A música que está tocando agora não está na playlist! Peça uma música usando !songrequest`;
            return response;            
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
            response.message = `🤔 A playlist está vazia! Peça uma música usando !songrequest`;
            return response;
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
        response.message = `🎵 Tocando agora: "${currentTrack.track_name}" adicionada por ${(currentTrack.user ? "@" + currentTrack.user.username : "usuário desconhecido")}`;

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

        response.message = `. ⏳ Próximas músicas na fila: ${nextTracksList}`;

        return response;
    } catch (error) {
        console.log(error);

    }

}