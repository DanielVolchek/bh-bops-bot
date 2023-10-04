import Express, { Request, Response } from "express";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const SPOTIFY_PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID

const REDIRECT_URI = 'http://localhost:5000/spotify_redirect';

export const router = Express.Router()

import querystring from 'node:querystring';
import { SpotifySearchResult, Track } from "./helpers";
import { argv0 } from "node:process";
import { sendSlackMessage } from "../slack";

const redirectHandler = async (req: Request, res: Response) => {
  if (!req.query || !req.query.code || !req.query.state) { 
    return res.status(400).json({error: "Bad Request"})
  }

  const { code } = req.query

  const key = code as string;
  const refresh = await getSpotifyAuthToken(key);

  res.status(200).json({message: "Refresh token is "+ refresh})
}

router.get("/spotify_redirect", redirectHandler)

const loginHandler = (req: Request, res: Response) => {
  const state = generateRandomString(16);
  const scope = 'user-read-private playlist-modify-public playlist-modify-private';
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state
    }));
}

router.get("/spotify_login", loginHandler)


const getRefreshToken = async () => {

  if (!REFRESH_TOKEN) {
    throw new Error("Expected Refresh Token in Process.Env")
  }
  
  const key = await getSpotifyRefreshedToken(REFRESH_TOKEN as string)
  return key;
}

export async function spotifySearchRequest(query: string) {

  const songs = await searchSong(query)
  return songs;

  // return blocks with song options
  // await addSongToPlaylist(foundUri.uri, key)
}


export const getSongByID = async (id: string) => {

  const key = await getRefreshToken()
  const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: {
      "Authorization": `Bearer ${key}`
    }
  })
  const data = await res.json() as Track
  return data;
}

const searchSong = async (query: string) => {

  const key = await getRefreshToken()

  const params = querystring.stringify({
    q: query,
    type: ['track'],
    limit: 3,
  })

  const res = await fetch('https://api.spotify.com/v1/search?'+params, {
    headers: {
      "Authorization": `Bearer ${key}`
    }
  })

  const data = await res.json() as SpotifySearchResult;

  return data;
}

export const addSongToPlaylist = async (userID: string, songID: string, songUri: string) => {
  const key = await getRefreshToken()

  const url = `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uris: [songUri],
    })
  })

  const data = await res.json()

  if (data.error) {
    console.log('error', data.error)
    throw new Error(data.error);
  }

  const track = await getSongByID(songID);
  const artists = track.artists.map(artist => artist.name).join(', ');

  await sendSlackMessage({ text: `<@${userID}>: <${track.external_urls.spotify}|${track.name} - ${artists}>`})
}

const getSpotifyAuthToken = async (code: string) => {

  if (!code) {
    throw new Error("Code not provided")
  }

  const url = 'https://accounts.spotify.com/api/token';

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  const auth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + auth
    },
    body: params
  })

  const data= await res.json()

  if (data.error) {
    console.error('errored ', data.error)
  }

  if (data.access_token && data.refresh_token) {
    return data.refresh_token;
  }
}

const getSpotifyRefreshedToken = async (refresh_token: string) => {
  const auth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
  const url = 'https://accounts.spotify.com/api/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refresh_token);

  const res = await fetch(url, {
    method: "POST",
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + auth
    }
  })

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data.access_token;
}

function generateRandomString(num: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < num; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
    charactersLength));
  }
  return result;
}
