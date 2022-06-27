import { availableSounds } from "../helpers/constants";
const soundplayer = require("sound-play");
const path = require("path");

export async function onSoundRequest(userId: number, username: string, sound: string){
    
    const response = {
        message: "",
    };

    try {
        if (availableSounds.includes(sound)) {
            const filePath = `./src/sounds/${sound}.mp3`;
            const fileRealPath = path.resolve(filePath);

            await soundplayer.play(fileRealPath, 1);
        } else {
            response.message = `${username}, o som que você pediu não foi encontrado!`;
        }
    } catch (error) {
        console.log(error);
        response.message = `${username}, houve um erro ao tentar reproduzir o som informado!`;
    }
    
    return response;
}