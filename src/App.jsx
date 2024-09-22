import { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [userQuestion, setUserQuestion] = useState('');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateAnswer() {
    setLoading(true);
    setResponseText('');
    try {
      const response = await axios({
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyC8OAslgVPQM0TSIjbnoYnWuxtKxKwHoug',
        method: 'POST',
        data: {
          "contents": [
            {
              "parts": [
                {
                  "text": userQuestion
                }
              ]
            }
          ]
        }
      });
      const answer = response.data.candidates[0].content.parts[0].text;
      setResponseText(answer);
    } catch (error) {
      console.error('Error generating answer:', error);
      setResponseText('Error generating answer. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const formatResponse = (text) => {
    return text
      .replace(/```(.*?)```/gs, '<pre class="code-block">$1</pre>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const readAloud = () => {
    if (responseText) {
      const utterance = new SpeechSynthesisUtterance(responseText);
      window.speechSynthesis.speak(utterance);
      return utterance;
    }
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(responseText).then(() => {
      alert('Response copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  const clearText = () => {
    setUserQuestion('');
    setResponseText('');
  };

  return (
    <div className="container">
      <h1>Chat Bot</h1>
      <textarea
        value={userQuestion}
        onChange={(e) => setUserQuestion(e.target.value)}
        placeholder="Write your question here..."
      />
      <button onClick={generateAnswer} disabled={loading}>Generate Answer</button>
      <div className="response-container">
        <h2>Response:</h2>
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: formatResponse(responseText) }} />
        )}
      </div>
      {responseText && !loading && (
        <div className="button-group">
          <button onClick={readAloud} title="Read Aloud"><i className="fas fa-volume-up"></i></button>
          <button onClick={stopReading} title="Stop"><i className="fas fa-stop"></i></button>
          <button onClick={copyResponse} title="Copy Response"><i className="fas fa-copy"></i></button>
          <button onClick={clearText} title="Clear Text"><i className="fas fa-trash"></i></button>
        </div>
      )}
    </div>
  );
}

export default App;
