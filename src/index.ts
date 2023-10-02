import express from 'express';
import bodyParser from 'body-parser';
import { router } from './spotify';
import {
  slackAddRequest, slackJamRequest, slackHelpRequest, slackPlaylistRequest,
} from './slack';

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

const port = 5000;

app.get('/', (req, res) => {
  res.send('Hello, Bun!');
});

app.post('/help', slackHelpRequest);

app.post('/add', slackAddRequest);

app.post('/jam', slackJamRequest);

app.post('/playlist', slackPlaylistRequest);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
