const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/users', routes);

app.get('/', (req, res) => {
  res.send('Users Service is running');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Users Service is running on port ${PORT}`);
});