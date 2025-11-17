import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/', routes);

app.get('/', (req, res) => {
  res.send('Products Service is running');
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Products Service is running on port ${PORT}`);
});
