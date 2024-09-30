import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import routes from '@/routes';
import morgan from 'morgan';
import cors from 'cors';

const app = express();
app.use(bodyParser.json());

// Use morgan for HTTP request logging
app.use(morgan('dev'));

// Enable CORS
app.use(cors());

app.use('/api', routes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
