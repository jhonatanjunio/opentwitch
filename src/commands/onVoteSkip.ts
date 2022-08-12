import { PrismaClient, User } from '@prisma/client'
import { currentPlayingTrackId, skipTrack } from '../interfaces/Spotify';
import { onSongList } from './onSongList';
const prisma = new PrismaClient()
const moment = require('moment-timezone');
import { promises as fs } from 'fs';

export async function onVoteSkip(userId: number, username: string, vote: string): Promise<any> {

    const response = {
        message: [""],
    };

    try {

        const getCurrentPlayingTrackId = await currentPlayingTrackId();
        const maxVotes = 5;

        // check if token is still available
        if (getCurrentPlayingTrackId == "new_token") {
            return await onVoteSkip(userId, username, vote);
        }

        if (!getCurrentPlayingTrackId) {
            response.message = [`🤔 Aparentemente não tem nenhuma música tocando no momento! Peça uma música usando !songrequest`];
            return response;
        }

        const liveParams = JSON.parse(await fs.readFile('./src/jsons/live_params.json', 'utf8'));

        const currentlyPlayingTrack = await prisma.livePlaylist.findMany({
            where: {
                track_id: getCurrentPlayingTrackId,
                created_at: {
                    gte: liveParams.start_date
                }
            },
            include: {
                user: true
            }
        });

        if (!currentlyPlayingTrack || currentlyPlayingTrack.length == 0) {
            response.message = [`🤔 A música que está tocando não está na playlist! Peça uma música usando !songrequest`];
            return response;
        }

        // check if user has already voted
        const getUserCurrentSkipCount = await prisma.livePlaylistSkipCount.count({
            where: {
                user_id: userId,
                live_playlists_id: currentlyPlayingTrack[0].id
            }
        });

        if (getUserCurrentSkipCount > 0) {
            response.message = [`@${username}, você já votou! 👍`];
            return response;
        } else {

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
                    created_at: "desc"
                },
                include: {
                    user: true
                }
            }).catch(error => {
                console.log(error);
                console.log("❌ Tudo indica que não há músicas na fila após a música atual!");
            });

            const nextTrack = nextTracksInQueue ? nextTracksInQueue[0] : null;

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

                
                if (currentlyPlayingTrack[0].skip_count + 1 == maxVotes && currentlyPlayingTrack[0].votes_ended == false) {
                    
                    await prisma.livePlaylist.update({
                        where: {
                            id: currentlyPlayingTrack[0].id
                        },
                        data: {
                            votes_ended: true,
                            updated_at: new Date(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"))
                        }
                    });
                    response.message.push(`👍 O povo pediu e a música foi pulada!`);

                    await skipTrack();

                    if (nextTrack) {
                        response.message.push(`⏩ Próxima música (tocando agora): "${nextTrack.track_name}" adicionada por ${(nextTrack.user ? "@" + nextTrack.user.username : "usuário desconhecido")}`);
                    } else {
                        response.message.push(`🤔 Não tem mais músicas na playlist!`);
                    }

                    return response;

                } else {
                    response.message = [`${username}, seu voto foi computado! 👍 Votos para pular a música: ${currentlyPlayingTrack[0].skip_count + 1}/${maxVotes}`];
                }
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
                
                if ((currentlyPlayingTrack[0].keep_count + 1) == maxVotes && currentlyPlayingTrack[0].votes_ended == false) {
                    
                    await prisma.livePlaylist.update({
                        where: {
                            id: currentlyPlayingTrack[0].id
                        },
                        data: {
                            votes_ended: true
                        }
                    });

                    response.message.push(`👍 O povo pediu e a música foi mantida!`);
                    const nextSongsInQueue = await onSongList(userId);
                    response.message.push(nextSongsInQueue.message);
                    return response;
                } else if ((currentlyPlayingTrack[0].keep_count + 1) > maxVotes || currentlyPlayingTrack[0].votes_ended == true) {
                    response.message = [`${username}, Votações encerradas! A música foi mantida 👍`];
                } else {

                    response.message.push(`${username}, seu voto foi computado! 👍 Votos para manter a música: ${currentlyPlayingTrack[0].keep_count + 1}/${maxVotes}`);
                    return response;
                }
            }

        }

        const currentTrack = currentlyPlayingTrack[0];        
        response.message.push(`🎵 Tocando agora: "${currentTrack.track_name}" adicionada por ${(currentTrack.user ? "@" + currentTrack.user.username : "usuário desconhecido")}`);
        return response;
    } catch (error) {
        console.log(error);
    }

}