import { Request, Response } from 'express';
import { SlackAPIRequest } from './helpers';
import { SlowBuffer } from 'buffer';
import { parse } from 'path';
import { spotifySearchRequest } from '../spotify';
import { HELP_BLOCKS, generateSongsBlock } from './blocks';

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
      responseObject = await slackAddRequest(body.trigger_id, remainingTokens)
      break;
    case 'playlist':
      responseObject = await slackPlaylistRequest()
      break;
    case 'jam':
      responseObject = await slackJamRequest()
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
      "text": "Just a modal"
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
  }).then((res) => res.json()).then(data => console.log(data))

  return {};
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

async function slackPlaylistRequest () {

  const ID=process.env.SPOTIFY_PLAYLIST_ID

  return {
    text: 'Playlist is' + 'playlist'
  };

}

async function slackHelpRequest () {

  return {
    blocks: HELP_BLOCKS
  };
}

export async function slackInteractionRequest (req: Request, res: Response) {
  
  const channelID = process.env.SLACK_CHANNEL_ID

  const response = {
  "channel": channelID,
  "text": "Hello world :tada:"
  }

  console.log(req.body)

  const payload = JSON.parse(req.body.payload)
  console.log(payload)

  res.send()

  // const resp = await fetch('https://slack.com/api/chat.postMessage', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': 'Bearer ' + SLACK_ACCESS_TOKEN
  //   },
  //   body: JSON.stringify(response)
  // })


  if (!payload.actions || !Array.isArray(payload.actions) || !payload.actions[0]) {
    setToClosedModal(payload.view.id)
  }

  const link = payload.actions[0].value as string
  const spotify_regex = /https?:\/\/open\.spotify\.com\/track\/[\w]+/

  if (!link.match(spotify_regex)) {
    setToClosedModal(payload.view.id, "Bad input, try again")
    return
  }

  setToClosedModal(payload.view.id)
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
