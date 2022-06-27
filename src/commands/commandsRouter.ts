import { availableSocials, availableSounds } from "../helpers/constants";
import { onLiveStart } from "./onLiveStart";
import { onSongList } from "./onSongList";
import { onSongRequest } from "./onSongRequest";
import { onSoundRequest } from "./onSoundRequest";
import { onVoteSkip } from "./onVoteSkip";

export const commandsRouter = [    
    {
        name: "!songrequest",
        description: "Adicionar uma música à fila",
        file: "onSongRequest",
        params: ["userId", "username", "trackId", "origin"],
        aliases: ["songrequest", "sr"],
        permissions: ["user", "mod", "admin"],
    },
    {
        name: "!songlist",
        description: "Listar as músicas na fila",
        file: "onSongList",
        params: ["userId"],
        aliases: ["songlist", "sl"],
        permissions: ["user", "mod", "admin"],
    },
    {
        name: "!voteskip",
        description: "Vote para pular a música atual",
        file: "onVoteSkip",
        params: ["userId", "username", "vote"],
        aliases: ["voteskip", "voteyes", "vs"],
        permissions: ["user", "mod", "admin"],
    },
    {
        name: "!votekeep",
        description: "Vote para manter a música atual",
        file: "onVoteSkip",
        params: ["userId", "username", "vote"],
        aliases: ["votekeep", "voteno", "vn", "vk"],
        permissions: ["user", "mod", "admin"],
    },
    {
        name: "!playsound",
        description: "Toque um som na live! Mande esse comando desta forma para saber os sons disponíveis.",
        file: "onVoteSkip",
        params: ["userId", "username", "vote"],
        aliases: ["votekeep", "voteno", "vn", "vk"],
        permissions: ["user", "mod", "admin"],
    },
    {
        name: "!socials",
        description: "Saiba as redes sociais do streamer",
        file: null,
        params: [],
        aliases:[],
        permissions: ["user", "mod", "admin"],
    },
    
];

export async function callCommand(command: string, params: any, userIsAdmin: boolean, userId: number, username: string) {

    let response = {
        message: "",
    }


    switch (command) {
        
        //Spotify Calls
        case "songrequest":
        case "sr":
            if (params.length && userId && username) {
                response = await onSongRequest(userId, username, params[0], "chat");
            } else {
                response.message = `${username}, formatos de link aceitos: https://open.spotify.com/track/6EThJr4Dq1Y93JspecGU2F?si=a96ffecc0b984a2a ou spotify:track:6EThJr4Dq1Y93JspecGU2F`;
            }
            break;

        case "songlist":
        case "sl":
            response = await onSongList(userId);
            break;

        case "voteskip":
        case "voteyes":
        case "vs":
            response = await onVoteSkip(userId, username, "skip");
            break;

        case "votekeep":
        case "voteno":
        case "vn":
        case "vk":
            response = await onVoteSkip(userId, username, "keep");
            break;

        //Memes
        case "playsound":
        case "ps":
            if (params.length && userId && username) {
                response = await onSoundRequest(userId, username, params[0]);
            } else {
                response.message = `${username},você precisa escolher um som! Sons disponíveis: ${availableSounds.join(", ")}`;
            }
            break;        

        //General
        case "help":
            response.message = `${username}, comandos disponíveis: ${commandsRouter.map(c => `${c.name} → ${c.description}`).join(" | ")}`;
            break;

        //Admin calls
        case "livestart":
            if (userIsAdmin) onLiveStart();
            else response.message = `${username}, você não tem permissão para executar esse comando!`;
            break;

        //Socials and links                                        
        case "socials":
            response.message = `${username}, redes sociais: ${availableSocials.map(s => `${s.name} → ${s.description}`).join(" | ")}`;
            break;
        case "linkedin":
            const linkedin = availableSocials.filter(s => s.name == "!linkedin")[0];
            response.message = `${username}, ${linkedin.description}`;
            break;
        case "github":
            const github = availableSocials.filter(s => s.name == "!github")[0];
            response.message = `${username}, ${github.description}`;
            break;
        case "discord":
            const discord = availableSocials.filter(s => s.name == "!discord")[0];
            response.message = `${username}, ${discord.description}`;
            break;
        case "twitter":
            const twitter = availableSocials.filter(s => s.name == "!twitter")[0];
            response.message = `${username}, ${twitter.description}`;
            break;
        case "instagram":
            const instagram = availableSocials.filter(s => s.name == "!instagram")[0];
            response.message = `${username}, ${instagram.description}`;
            break;    

        default:
            response.message = `${username}, comando não reconhecido!`;
            break;
    }

    return response;

}