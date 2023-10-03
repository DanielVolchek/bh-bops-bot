import express from 'express';
import bodyParser from 'body-parser';
import { slackBopRequest, slackInteractionRequest } from './slack';
import { router } from './spotify';

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Hello, Bun!');
});

app.post('/bop', slackBopRequest);

app.post('/interaction', slackInteractionRequest);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
