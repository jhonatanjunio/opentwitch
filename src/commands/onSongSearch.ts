import { searchTrack } from '../interfaces/Spotify';
import { promises as fs } from 'fs';
import { onSongRequest } from './onSongRequest';

/**
 * Function called when user is searching for a song
 * 
 * @param {number}      userId          ID of the user who is searching for a song
 * @param {string}      username        Username of the user who is searching for a song
 * @param {string}      search          Search term
 * 
 * @returns {Promise<any>}
 */
export async function onSongSearch(userId: number, username: string, search: string): Promise<any> {

    const searchResult: any = await searchTrack(userId, search);
    let result: Array<string> = [];

    if (searchResult == "new_token") {
        console.log("🔂 Recalling onSongSearch() function after receiving a new Spotify token ...");
        return await onSongSearch(userId, username, search);
    }

    if (searchResult == "in_search") {

        result = [`${username}, você ainda não escolheu uma das opções de resultado para a sua busca.`];

        let currentSearch: any = fs.readFile('./src/jsons/sound_search_results.json', 'utf8');
        currentSearch = JSON.parse(await currentSearch) as Array<any>;

        let searchEntry = currentSearch.filter((search: any) => search.user_id == userId)[0];
        let results = searchEntry.results;

        const resultStr = results.map((item: any) => {
            return `${item.result_id}) ${item.track_name}`;
        }).join(", ");

        result.push(`${username}, os seguintes resultados foram encontrados para a música que você está procurando: ${resultStr}`);
        result.push(`${username}, mande o comando !cs + número do resultado que corresponde a sua busca para escolher!`);

        return result;
    }

    if (searchResult == "no_results") {
        return `${username}, nenhum resultado encontrado para a música "${search}"! Tem certeza que escreveu corretamente?`;
    }

    if (searchResult && searchResult.results) {
        const resultStr = searchResult.results.map((item: any) => {
            return `${item.result_id}) ${item.track_name}`;
        }).join(", ");

        result = [`${username}, os seguintes resultados foram encontrados para a música que você está procurando: `, resultStr];
        result.push(`${username}, mande o comando !cs + número do resultado que corresponde a sua busca para escolher!`);
    }

    return result;

}

/**
 * Function called when user requests to add a song to Spotify Queue
 * 
 * @param {number}      userId          ID of the user who is requesting to add a song to Spotify Queue
 * @param {string}      username        Username of the user who is choosing a song
 * @param {string}      choice          The ID of the song that the user wants to add to the queue
 * 
 * @returns {Promise<any>}
 */
export async function onSongChoose(userId: number, username: string, choice: number): Promise<any> {

    let result: Array<string> = [];

    let currentSearch: any = fs.readFile('./src/jsons/sound_search_results.json', 'utf8');
    currentSearch = JSON.parse(await currentSearch) as Array<any>;

    let searchEntry = currentSearch.filter((search: any) => search.user_id == userId)[0];

    if (!searchEntry) {
        result = [`${username}, você não realizou nenhuma busca de música! Para começar, mande o comando !search + o nome da música que você quer procurar!`];
    } else {
        let results = searchEntry.results;
        let track_id = results[choice - 1].track_id;
        let track_name = results[choice - 1].track_name;
        result = [`${username}, você escolheu a música "${track_name}"! Adicionando a música na fila ...`];
        const requestedSong = await onSongRequest(userId, username, `spotify:track:${track_id}`, "search");
        result.push(requestedSong.message);

        if (!requestedSong.errorMsg) {
            let newSearch = currentSearch.filter((search: any) => search.user_id != userId);
            fs.writeFile('./src/jsons/sound_search_results.json', JSON.stringify(newSearch));
        }
    }

    return result;

}