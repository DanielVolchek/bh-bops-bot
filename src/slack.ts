import { Request, Response } from 'express';
import { spotifySlackRequest } from './spotify';

type SlackBody = {
  text: string
}

export type Song = {
  title: string;
  artist: string;
  error?: string;
}

export async function slackAddRequest (req: Request, res: Response){
  const body = req.body as SlackBody

  if (!body.text) {
    return res.status(400).json({error: "Bad Formatting"})
  }

  const song = parseSong(body.text)
  if (song.error) {
    return res.status(200).json({text: song.error})
  }

  const result = await spotifySlackRequest(req, res, song)
  return res.status(200).json(result)
};

export async function slackJamRequest (req: Request, res: Response) {

  const JAM_LINK = process.env.SPOTIFY_JAM_LINK

  const RULES="(This is WIP and probably doesn't work yet, I'm working on it though)\nThe following link goes to a spotify jam, where we can all listen to music at the same time. You are welcome to add your own music, but please pay attention to the following rules:\n- If you would like to add a song, please add it to the queue instead of changing the playlist (bh-bops) that is running\n- Please do not pause the playlist\nThis only works on mobile. Sorry Desktop users!\nThat's all. Enjoy!\nLink: " + JAM_LINK

  res.status(200).send(RULES)
}

export async function slackPlaylistRequest (req: Request, res: Response) {

  const ID=process.env.SPOTIFY_PLAYLIST_ID

  res.status(200).send(`https://open.spotify.com/playlist/${ID}`)
}


export async function slackHelpRequest (req: Request, res: Response) {
  console.log('hit help request')
  console.log('body is ', req.body)

  const GITHUB_LINK = "https://github.com/danielvolchek/bh-bops-bot"

  const HELP_TEXT = "/bops-add:\n>*Description*: This command allows you to add a song to the group playlist.\n>*Usage*: /bops-add <song name> - <artist name>\n>*Example*: /bops-add White Ferrari - Frank Ocean\n\n/bops-help:\n>*Description*: Provides usage instructions for all Bops commands.\n>*Usage*: Simply type /bops-help to get information about how to use each command. No additional arguments are needed.\n\n/bops-jam:\n>*Description*: Get link to group Spotify Jam, where everyone can listen together.\n>*Usage*: /bops-jam\n\n/bops-playlist:\n>*Description*: This command gives you a direct link to the group playlist.\n>*Usage*: /bops-playlist\n\nIf you have any other questions, feel free to ask! If you would like to check out how this is implemented or contribute, check out the code here: " + GITHUB_LINK

  res.status(200).send(HELP_TEXT)
  
}

const parseSong = (text: string) : Song => {

  const parts = text.split(' - ').map(p => p.trim())
  
  if (parts.length == 2) {
    return {title: parts[0], artist: parts[1]}
  }

  return {title: '', artist: '', error: 'Error: Bad Formatting, please ensure you are formatting as "Song - Artist" without quotes'}
}
