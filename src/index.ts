import express from 'express';
import bodyParser from 'body-parser';
import { router } from './spotify';
import SlackRequest from './slack';

const app = express();
app.use(bodyParser.json());
app.use(router);

const port = 5000;

app.get('/', (req, res) => {
  res.send('Hello, Bun!');
});

app.post('/help', (req, res) => {

});

app.post('/add', SlackRequest);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
