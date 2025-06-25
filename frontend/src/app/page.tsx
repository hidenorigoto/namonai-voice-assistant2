'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleSendAudio;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      // First, always transcribe the audio
      const transcriptionResponse = await fetch('http://localhost:3001/api/speech', {
        method: 'POST',
        body: formData,
      });
      const transcriptionData = await transcriptionResponse.json();
      const userMessageContent = transcriptionData.markdown;

      const userMessage: Message = { role: 'user', content: userMessageContent };
      const currentHistory = [...conversationHistory, userMessage];
      setConversationHistory(currentHistory);

      // If it's the first message, get the investigation document
      if (!investigationResult) {
        setInvestigationResult(userMessageContent);
      } else {
        // For subsequent messages, call the chat endpoint
        const chatResponse = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newMessage: userMessage,
            history: conversationHistory, // Send history before the new user message
            contextDocument: investigationResult,
          }),
        });

        const audioBlob = await chatResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
          audioRef.current.onended = () => setIsPlaying(false);
        }
        // We don't have the text of the assistant's message, so we can't add it to history yet.
        // This would be a good improvement for a future step.
      }

    } catch (error) {
      console.error('Error during audio processing:', error);
      alert('Failed to process audio.');
    }

    audioChunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8">Voice Discussion PoC</h1>
      <div className="w-full max-w-4xl">
        <div className="space-x-4 text-center mb-4">
          <button
            onClick={handleStartRecording}
            disabled={isRecording || isPlaying}
            className="px-6 py-3 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>
          <button
            onClick={handleStopRecording}
            disabled={!isRecording}
            className="px-6 py-3 bg-red-500 text-white rounded-md disabled:bg-gray-400"
          >
            Stop Recording
          </button>
          {isPlaying && <p className="text-lg mt-2">Playing AI response...</p>}
          <audio ref={audioRef} className="hidden" />
        </div>
        <div className="flex gap-4">
          {investigationResult && (
            <div className="w-1/2 p-6 bg-white rounded-md shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Investigation Results:</h2>
              <article className="prose lg:prose-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {investigationResult}
                </ReactMarkdown>
              </article>
            </div>
          )}
          <div className={`w-${investigationResult ? '1/2' : 'full'} p-6 bg-white rounded-md shadow-md`}>
            <h2 className="text-2xl font-semibold mb-4">Conversation:</h2>
            <div className="space-y-4">
              {conversationHistory.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}