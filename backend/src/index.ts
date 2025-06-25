import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = 3001;

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors({ origin: 'http://localhost:3000' }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.post('/api/speech', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('model', 'whisper-1');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    res.status(200).json({ transcription: response.data.text });
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).send('Error processing audio.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
