import { Request, Response } from 'express';
import SpotifyRequest from './spotify';

type SlackBody = {
  text: string
}

export type Song = {title: string, artist: string}

export default async function SlackHandler (req: Request, res: Response){
  const body = req.body as SlackBody

  if (!body.text) {
    return res.status(400).json({error: "Bad Formatting"})
  }

  let song: Song;
  try{
    song = parseSong(body.text)
  } catch(err){
    return res.status(400).json({error: "Bad Formatting"})
  }

  await SpotifyRequest(res, song)
};

const parseSong = (text: string) : Song => {
  const parts = text.split('-').map(p => p.trim())
  
  if (parts.length == 2) {
    return {title: parts[0], artist: parts[1]}
  }

  throw new Error("Bad formatting")  
}

