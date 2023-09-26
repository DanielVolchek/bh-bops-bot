import { Request, Response } from 'express';

type SlackBody = {
  text: string
}

type Song = {title: string, artist: string}

export default function SlackHandler (req: Request, res: Response){
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


};

const parseSong = (text: string) : Song => {
  const parts = text.split('-').map(p => p.trim())
  
  if (parts.length == 2) {
    return {title: parts[0], artist: parts[1]}
  }

  throw new Error("Bad formatting")  
}

