import Express, { Request, Response } from "express";

import { Song } from "./slack";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const REDIRECT_URI = 'http://localhost:5000/spotify_redirect';

export const router = Express.Router()

import querystring from 'node:querystring';

let key = "";

const redirectHandler = (req: Request, res: Response) => {
  if (!req.query || !req.query.code || !req.query.state) { 
    return res.status(400).json({error: "Bad Request"})
  }

  const {code, state} = req.query

  key = code as string;

  res.status(200).json({message: "Success"})
}

router.get("/spotify_redirect", redirectHandler)

const loginHandler = (req: Request, res: Response) => {
  const state = generateRandomString(16);
  const scope = 'user-read-private playlist-modify-public';
  
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

export default async function SpotifySlackRequest(res: Response, song: Song) {
  if (!REFRESH_TOKEN) {
    res.status(400).json({error: "Spotify key required, login for functionality"})
    return
  }
  
  await handleSpotifyRequest(song)

}

const handleSpotifyRequest = async (song: Song) => {

}

const searchSong = async (song: Song) => {

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
    throw new Error(data.error)
  }

  if (data.access_token && data.refresh_token) {
    key = data.access_token;
    refresh_token = data.refresh_token
  }
}

const getSpotifyRefreshedToken = async (refresh_token: string) => {
  const auth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
  const url = 'https://accounts.spotify.com/api/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refresh_token);
  
  const authOptions = {
    body: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    headers: {
      'Authorization': 'Basic ' + auth
    },
  };

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

  if (data.access_token) {
    key = data.access_token;
  }

}

const initializeSpotifyConnection = async (res: Response) => {

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
