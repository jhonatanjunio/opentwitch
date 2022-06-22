import { currentPlayingTrackId } from "../interfaces/Spotify";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { promises as fs } from 'fs';

export async function getCurrentPlayingSong(): Promise<any> {

    const response = {
        message: "",
    };

    try {

        let getCurrentPlayingTrackId = await currentPlayingTrackId();
        if (getCurrentPlayingTrackId == "new_token") {
            return await getCurrentPlayingSong();            
        }

        if (!getCurrentPlayingTrackId) {
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
        response.message = `🎵 Tocando agora: "${currentTrack.track_name}" adicionada por ${(currentTrack.user ? "@" + currentTrack.user.username : "usuário desconhecido")}`;
        return response;
        
    } catch (error) {
        console.log(error)
    }
}