import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { configDotenv } from 'dotenv';
import { MainRouter } from './routes';

// Load environment variables
configDotenv();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // Enable CORS
app.use(helmet()); // Security headers

const mainRouter = new MainRouter();

app.get('/health', (_req: Request, res: Response) => {
  res.send('ok');
});

app.use('/api', mainRouter.getRouter());

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
