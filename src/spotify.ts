import Express, { Request, Response } from "express";

import { Song } from "./slack";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const SPOTIFY_PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID

const REDIRECT_URI = 'http://localhost:5000/spotify_redirect';

export const router = Express.Router()

import querystring from 'node:querystring';

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

export async function spotifySlackRequest(req: Request, res: Response, song: Song) {
  if (!REFRESH_TOKEN) {
    throw new Error("Expected Refresh Token in Process.Env")
  }
  
  const key = await getSpotifyRefreshedToken(REFRESH_TOKEN as string)

  const foundUri = await searchSong(key, song)
  if (!foundUri) {
    return { text: 'Song not found' }
  }

  await addSongToPlaylist(foundUri.uri, key)
  return { text: `<@${req.body.user_id}>: <${foundUri.url}|${song.title} - ${song.artist}>`, response_type: "in_channel", replace_original:true }
}

const searchSong = async (key: string, song: Song) => {
  const params = querystring.stringify({
    q: `track:${song.title} artist:${song.artist}`,
    type: ['track'],
    limit: 1,
  })

  const res = await fetch('https://api.spotify.com/v1/search?'+params, {
    headers: {
      "Authorization": `Bearer ${key}`
    }
  })

  const data = await res.json();

  if (data && data.tracks && data.tracks.items && data.tracks.items[0]) {
    return {url: data.tracks.items[0].external_urls.spotify, uri: data.tracks.items[0].uri}
  }

}

const addSongToPlaylist = async (songUri: string, key: string) => {
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
    throw new Error(data.error);
  }
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
