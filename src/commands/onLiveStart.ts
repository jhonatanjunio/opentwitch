import { PrismaClient } from '@prisma/client'
import { refreshToken } from '../interfaces/Spotify';
const prisma = new PrismaClient()
const moment = require('moment-timezone');
import { promises as fs } from 'fs';

/**
 * Function called when the livestream starts (required function)
 */
export async function onLiveStart(){
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