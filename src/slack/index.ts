import { Request, Response } from 'express';
import { SlackAPIRequest } from './helpers';
import { addSongToPlaylist, getSongByID, spotifySearchRequest } from '../spotify';
import { HELP_BLOCKS, generateSongsBlock } from './blocks';
import { isArray } from 'util';

export type Song = {
  title: string;
  artist: string;
  error?: string;
}

export async function slackBopRequest (req: Request, res: Response){
  
  const body = req.body as SlackAPIRequest

  if (!body.text) {
    res.send(await slackHelpRequest())
    return
  }
  
  const tokens = body.text.split(' ');

  let responseObject = {}

  switch(tokens[0]) {
    case 'add':
      const remainingTokens = tokens.slice(1).join(' ');
      if (!remainingTokens) {
        return res.send('Please input a search query')
      }
      responseObject = await slackAddRequest(body.trigger_id, remainingTokens)
      return res.send()
    case 'playlist':
      responseObject = await slackPlaylistRequest()
      break;
    default:
    case 'help':
      responseObject = await slackHelpRequest()
      break;
  }

  res.json(responseObject)
}

async function slackAddRequest (trigger_id: string, query: string){

  // search for song

  const songs = await spotifySearchRequest(query)

  const songBlocks = generateSongsBlock(songs)

  const response = {  
  "trigger_id": trigger_id,
  "view": {
    "type": "modal",
    "callback_id": "modal-identifier",
    "title": {
      "type": "plain_text",
      "text": "Add Song"
      },
    "blocks": songBlocks
    }
  }

  const SLACK_ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN;

  fetch('https://slack.com/api/views.open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SLACK_ACCESS_TOKEN
    },
    body: JSON.stringify(response)
  })

  return '';
};

// async function slackJamRequest () {
//
//   const JAM_LINK = process.env.SPOTIFY_JAM_LINK
//
//   const RULES="(This is WIP and probably doesn't work yet, I'm working on it though)\nThe following link goes to a spotify jam, where we can all listen to music at the same time. You are welcome to add your own music, but please pay attention to the following rules:\n- If you would like to add a song, please add it to the queue instead of changing the playlist (bh-bops) that is running\n- Please do not pause the playlist\nThis only works on mobile. Sorry Desktop users!\nThat's all. Enjoy!\nLink: " + JAM_LINK
//
//   return {text: RULES}
//
// }


export async function sendSlackMessage (content: Object) {

  const ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN
  const CHANNEL_ID = process.env.SLACK_CHANNEL_ID

  const request = {
    channel: CHANNEL_ID,
    ...content
  }

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify(request)
  })
}

async function slackPlaylistRequest () {

  const ID=process.env.SPOTIFY_PLAYLIST_ID

  return {
    'text': `<https://open.spotify.com/playlist/${process.env.SPOTIFY_PLAYLIST_ID}|Playlist Link>`
  };

}

async function slackHelpRequest () {

  return {
    blocks: HELP_BLOCKS
  };
}

export async function slackInteractionRequest (req: Request, res: Response) {
  
  const payload = JSON.parse(req.body.payload)

  res.send()

  if (!payload.actions || !Array.isArray(payload.actions) || !payload.actions[0]) {
    setToClosedModal(payload.view.id)
  }

  let {value, type} = payload.actions[0]

  const spotify_regex = /https?:\/\/open\.spotify\.com\/track\/[\w]+/

  let id = ''
  let uri = '';

  if (type === "plain_text_input") {
    if (!value.match(spotify_regex)) {
      setToClosedModal(payload.view.id, "Bad input, try again")
      return
    }

    // get url from spotify
    id = value.split('/').at(-1)

    const song = await getSongByID(id);

    if (song.uri) {
      uri = song.uri
    }
    else {
      setToClosedModal(payload.view.id, "Bad input, try again")
      return
    }
  } else {
    [id, uri] = value.split(';');
  }

  setToClosedModal(payload.view.id)
  addSongToPlaylist(payload.user.id, id, uri)
}

const setToClosedModal = (modalID: string, text = "Done") => {

  const request = {
      "view_id": modalID,
      "view": {
          "type": "modal",
          "title": {
              "type": "plain_text",
              "text": "Close Modal"
          },
          "blocks": [
              {
                  "type": "section",
                  "text": {
                      "type": "mrkdwn",
                      "text": text
                  },
              }
          ]
      }
  }

  const SLACK_ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN

  fetch('https://slack.com/api/views.update', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SLACK_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(request)
    })
}
