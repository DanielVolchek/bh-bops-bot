import { SpotifySearchResult, Track } from "../spotify/helpers";

const GITHUB_LINK = 'https://github.com/danielvolchek/bh-bops-bot'

export const HELP_BLOCKS = [
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "*Command*: /bops add\n>*Description*: This command allows you to add a song to the group playlist.\n>*Usage*: /bops add \"Query\"\n>*Example*: /bops add White Ferrari"
        }
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "*Command*: /bops help\n>*Description*: Provides usage instructions for all Bops commands.\n>*Usage*: Simply type /bops help to get information about how to use each command. No additional arguments are needed."
        }
    },
    // {
    //     "type": "section",
    //     "text": {
    //         "type": "mrkdwn",
    //         "text": "*Command*: /bops jam\n>*Description*: Get link to group Spotify Jam, where everyone can listen together.\n>*Usage*: /bops jam"
    //     }
    // },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "*Command*: /bops playlist\n>*Description*: This command gives you a direct link to the group playlist.\n>*Usage*: /bops playlist"
        }
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `If you have any other questions, feel free to ask! If you would like to check out how this is implemented or contribute, check out the code here: ${GITHUB_LINK}`
        }
    }
]

// add header
// add divider
// loop through songs and add divider for each one
// add input


const HEADER_BLOCK = [ 
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Songs found...",
				"emoji": true
			}
		},
		{
			"type": "section",
			"block_id": "sectionBlockOnlyMrkdwn1",
			"text": {
				"type": "mrkdwn",
				"text": "Choose a song to add from the following list..."
			}
		},
		{
			"type": "divider"
		},
]

const generateSongBlock = (track: Track ) => {
  const block=  [
    {
			"type": "section",
			"block_id": Math.floor(Math.random() * 10001).toString(),
			"text": {
				"type": "mrkdwn",
				"text": `*${track.name}*\n*${track.artists.map(a => a.name).join(', ')}*\n${track.preview_url ? `<${track.preview_url}|Listen to a preview>` : 'No Preview Found'}`
			},
			"accessory": {
				"type": "image",
				"image_url": `${track.album.images[0].url}`,
				"alt_text": "Album Image"
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "✅",
						"emoji": true
					},
          "style": "primary",
					"value": `${track.id};${track.uri}`,
					"action_id": "actionId-0"
				}
			]
		},
		{
			"type": "divider"
		}]
  return block;
}

const INPUT_BLOCK = [ 
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Can't find what you're looking for?",
				"emoji": true
			}
		},
		{
			"type": "section",
			"block_id": "sectionBlockOnlyMrkdwn",
			"text": {
				"type": "mrkdwn",
				"text": `Enter the link directly... Go <${process.env.APP_URL}/find_track|here> if you don't know how`
			}
		},
		{
			"dispatch_action": true,
			"type": "input",
			"element": {
				"type": "plain_text_input",
				"action_id": "url_input-action"
			},
			"label": {
				"type": "plain_text",
				"text": "Input URL:",
				"emoji": true
			}
		}
]

export const generateSongsBlock = ({tracks}: SpotifySearchResult) => {

  const songBlocks = tracks.items.map(track => generateSongBlock(track))

  let mergedArray: any[]= []

  for (const blocks of songBlocks) {
    mergedArray = [...mergedArray, ...blocks];
  }

  return [...HEADER_BLOCK, ...mergedArray, ...INPUT_BLOCK]
};
