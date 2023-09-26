import express from 'express';
import SlackRequest from './slack';

const app = express();

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
