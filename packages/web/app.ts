import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { configDotenv } from 'dotenv';
import { MainRouter } from './routes';

// Load environment variables
configDotenv();

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  'https://simple-test-fixer-d6cc7.web.app',
  'https://simple-test-fixer-d6cc7.firebaseapp.com',
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Local testing
];

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet()); // Security headers

const mainRouter = new MainRouter();

app.get('/health', (_req: Request, res: Response) => {
  res.send('ok');
});

app.use('/api', mainRouter.getRouter());

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
