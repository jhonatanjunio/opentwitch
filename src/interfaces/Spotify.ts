const axios = require('axios');
import { promises as fs } from 'fs';
const SpotifyWebApi = require('spotify-web-api-node');
const spotify_token = fs.readFile('./src/jsons/spotify_token.json', 'utf8');
const querystring = require('querystring');

const redirectUri = 'http://localhost:3003/spotify/callback',
    clientId = process.env.SPOTIFY_CLIENT_ID,
    clientSecret = process.env.SPOTIFY_CLIENT_SECRET


const spotifyApi = new SpotifyWebApi({
    redirectUri: redirectUri,
    clientId: clientId,
    clientSecret: clientSecret
});

//Function used to generate a random string with a length of n | Called when trying to generate a new code grant
function rand(length: number, current: string = ""): string {
    current = current ? current : '';
    return length ? rand(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
}

//Refresh Spotify token function | Called whenever the token expires
async function refreshToken() {
    let refresh_token_obj: any = JSON.parse(await spotify_token);
    const refresh_token = refresh_token_obj.refresh_token;
    const url = 'https://accounts.spotify.com/api/token';
    const headers = {
        'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    await axios.post(url, querystring.stringify({
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token
    }), { headers: headers }).then(async (res: any) => {

        refresh_token_obj.access_token = res.data.access_token
        await fs.writeFile('./src/jsons/spotify_token.json', JSON.stringify(refresh_token_obj));

        return res.data.access_token;
    });
}

//Code grant generator function | Called by a GET request
 function generateCodeGrant() {
    let scopes = ['user-modify-playback-state', 'user-read-currently-playing', 'user-read-playback-state'],
        state = rand(16);

    let authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    let open = require('open');
    open(authorizeURL, { wait: true });
}

//Generate Spotify tokens function | Called by a GET request
async function generateTokens() {
    const spotify_grant_code = fs.readFile('./src/jsons/spotify_grant_code.json', 'utf8');
    let grant_code: any = JSON.parse(await spotify_grant_code);
    grant_code = grant_code.code;
    spotifyApi.authorizationCodeGrant(grant_code)
        .then(function (data: any) {

            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            console.log(data.body);

            fs.writeFile('./src/jsons/spotify_token.json', JSON.stringify(data.body));

        }, function (err: any) {
            console.log('Something went wrong!', err);
        });

    return await spotifyApi.getAccessToken() as string;
}

//Get Spotify token function | Called at every Spotify API calls
async function getToken(): Promise<string> {
    const re_read_spotify_token = await fs.readFile('./src/jsons/spotify_token.json', 'utf8');
    let token: any = JSON.parse(re_read_spotify_token);
    token = token.access_token;
    return token;
}

//Check the given Spotify URI and return the track ID
function extractSpotifyUrl(url: string, onlyId: boolean = false): string {

    //Biazzotto regex god♥
    const regex = /([A-Za-z0-9]{22})/
    const match = regex.exec(url)
    if (!match) return "error";

    if (match) {
        return onlyId ? match[1] : `spotify:track:${match[1]}`;
    }
    throw new Error('URL Spotify inválida [fim]')
}

//Get a track's name and artist from a Spotify URI
async function getMusicName(trackId: string): Promise<string> {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/tracks/${trackId}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    let musicData: string = "";

    await axios.get(url, { headers: headers })
        .then( (res: any) => {
            musicData = `${res.data.artists[0].name} - ${res.data.name}`;
        })
        .catch(async (err: any) => {
            console.log("🔂 [Spotify::getMusicName()] Gerando uma nova token para tentar novamente ...");
            await refreshToken();
            musicData = "new_token";
        });

    return musicData;
}

//Adds a track to the playlist
async function addToQueue(trackId: string) {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/me/player/queue?uri=${trackId}&device_id=${process.env.SPOTIFY_DEVICE_ID}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    const response = await axios.post(url, {}, { headers: headers });

    return response.data;
}

//Gets the current track playing ID
async function currentPlayingTrackId(): Promise<string> {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/me/player/currently-playing`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    let currentPlayingTrackId = "";
    
    await axios.get(url, { headers: headers })
        .then( (res: any) => {
            currentPlayingTrackId = res.data && res.data.item ? res.data.item.id : "";
        })
        .catch(async (err: any) => {
            console.log("🔂 [Spotify::currentPlayingTrackId()] Gerando uma nova token para tentar novamente ...");
            await refreshToken();
            currentPlayingTrackId = "new_token";
        });

    return currentPlayingTrackId;
}

//When the maximum skip votes are reached, skip the current track
async function skipTrack() {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/me/player/next`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    const response = await axios.post(url, {}, { headers: headers }).catch(async (err: any) => {
        console.log("Gerando uma nova token para tentar novamente ...");
        await refreshToken();
        skipTrack();
    });;

    return response.data;
}

async function searchTrack(userId: number, search: string) {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURI(search)}&type=track&limit=4`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    let currentSearch: any = fs.readFile('./src/jsons/sound_search_results.json', 'utf8');
    currentSearch = JSON.parse(await currentSearch) as Array<any>;
    let result = "";

    if (currentSearch.filter((search: any) => search.user_id == userId).length > 0) {
        result = "in_search";
    } else {

        let foundResults: any = [];
        let results: any = [];

        await axios.get(url, { headers: headers })
            .then( (res: any) => {
                foundResults = res.data.tracks.items;
            })
            .catch(async (err: any) => {
                console.log("🔂 [Spotify::searchTrack()] Gerando uma nova token para tentar novamente ...");
                await refreshToken();
                result = "new_token";
            });

        if (result == "new_token") return result;

        if (foundResults.length == 0) {
            result = "no_results";
            return result;
        } else {

            let track_id = "";
            let track_name = "";
            let result_id = 1;
            for (const foundResult of foundResults) {
                track_id = foundResult.id;
                track_name = `${foundResult.artists[0].name} - ${foundResult.name}`;
                results.push({
                    result_id,
                    track_id,
                    track_name
                });
                result_id++;
            }
        }

        const newEntry = {
            user_id: userId,
            search_term: search,
            results
        }

        currentSearch.push(newEntry);

        await fs.writeFile('./src/jsons/sound_search_results.json', JSON.stringify(currentSearch));
        return newEntry;
    }

    return result;
}

export { refreshToken, generateCodeGrant, generateTokens, extractSpotifyUrl, addToQueue, skipTrack, currentPlayingTrackId, getMusicName, searchTrack }