import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const port = 3001;

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors({ origin: 'http://localhost:3000' }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.post('/api/speech', upload.single('audio'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  // For now, just confirm receipt of the file
  res.status(200).send({ message: 'File uploaded successfully', filename: req.file.originalname });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
