import express, { Request, Response } from 'express';


const app = express();
const port = 3000;

app.get('/health', (_req: Request, res: Response) => {
  res.send('ok');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})
