import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, modelId, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }

    // Convert the conversation history to the format Gemini expects
    const geminiHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }

    // Default to gemini-2.5-flash unless specified
    const modelStr = modelId === 'mira-advanced' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    // Initialize the model with optional system instruction
    const modelConfig = systemPrompt
      ? { systemInstruction: systemPrompt }
      : {};
    const model = genAI.getGenerativeModel({ model: modelStr, ...modelConfig });

    // Start a chat session with history
    const chat = model.startChat({ history: geminiHistory });

    // Send the latest user message
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    res.json({ response: responseText });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});