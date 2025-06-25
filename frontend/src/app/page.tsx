'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [serverResponse, setServerResponse] = useState(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      setServerResponse(null);
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
      const response = await fetch('http://localhost:3001/api/speech', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setServerResponse(data);
    } catch (error) {
      console.error('Error sending audio:', error);
      alert('Failed to send audio to server.');
    }

    audioChunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Voice Discussion PoC</h1>
      <div className="space-x-4">
        <button
          onClick={handleStartRecording}
          disabled={isRecording}
          className="px-6 py-3 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
        >
          Start Recording
        </button>
        <button
          onClick={handleStopRecording}
          disabled={!isRecording}
          className="px-6 py-3 bg-red-500 text-white rounded-md disabled:bg-gray-400"
        >
          Stop Recording
        </button>
      </div>
      {serverResponse && (
        <div className="mt-8 p-4 bg-white rounded-md shadow-md">
          <h2 className="text-2xl font-semibold">Server Response:</h2>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(serverResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}