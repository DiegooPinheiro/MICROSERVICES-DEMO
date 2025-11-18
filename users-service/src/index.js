// users-service/src/index.js
import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/users', routes);

app.get('/', (req, res) => {
  res.send('Users Service is running');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Users Service is running on port ${PORT}`);
});
