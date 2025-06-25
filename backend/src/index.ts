import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = 3001;

// Middlewares
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.post('/api/speech', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Step 1: Transcribe audio to text
    const audioFormData = new FormData();
    audioFormData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    audioFormData.append('model', 'whisper-1');

    const transcriptionResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', audioFormData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...audioFormData.getHeaders(),
      },
    });

    const topic = transcriptionResponse.data.text;

    // Step 2: Investigate the topic and generate Markdown
    const investigationResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Your task is to investigate the given topic and generate a structured Markdown document that provides a solid foundation for a deep discussion. The document should include a summary, key points, historical context, and potential questions or viewpoints. Use clear headings for each section.'
        },
        {
          role: 'user',
          content: `Please investigate the following topic: ${topic}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const markdownContent = investigationResponse.data.choices[0].message.content;

    res.status(200).json({ markdown: markdownContent });

  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).send('Error processing audio.');
  }
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const { newMessage, history, contextDocument } = req.body;

  if (!newMessage || !history || !contextDocument) {
    return res.status(400).send('Missing required fields.');
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `You are a discussion partner. Your goal is to facilitate a deep and thoughtful conversation. You have the following research document as context:\n\n${contextDocument}`
      },
      ...history,
      newMessage
    ];

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: messages
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).send('Error processing chat message.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
