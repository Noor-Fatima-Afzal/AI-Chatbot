import { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [userQuestion, setUserQuestion] = useState('');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const formatResponse = (text) => {
    return text
      .replace(/```(.*?)```/gs, '<pre class="code-block">$1</pre>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const readAloud = () => {
    if (responseText) {
      const utterance = new SpeechSynthesisUtterance(responseText);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
  };

  const copyResponse = () => {
    navigator.clipboard
      .writeText(responseText)
      .then(() => alert('Response copied to clipboard!'))
      .catch((err) => console.error('Could not copy text: ', err));
  };

  const clearText = () => {
    setUserQuestion('');
    setResponseText('');
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  async function generateAnswer() {
    setLoading(true);
    setResponseText('');

    const API_URL = 'http://localhost:5000/generateAnswer';

    try {
      const response = await axios.post(API_URL, {
        inputs: userQuestion,
      });

      const answer = response.data.generated_text;
      setResponseText(answer);

      await axios.post('http://localhost:5000/saveChat', {
        userQuestion,
        responseText: answer,
      });
    } catch (error) {
      console.error('Error generating answer:', error.response || error);
      setResponseText('An error occurred. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const response = await axios.get('http://localhost:5000/chatHistory');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }

  async function deleteChat(id) {
    try {
      await axios.delete(`http://localhost:5000/deleteChat/${id}`);
      setHistory(history.filter((chat) => chat.id !== id));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className="container">
      <h1>Chat Bot</h1>
      <textarea
        value={userQuestion}
        onChange={(e) => setUserQuestion(e.target.value)}
        placeholder="Write your question here..."
      />
      <button onClick={generateAnswer} disabled={loading}>
        Generate Answer
      </button>
      <button onClick={toggleHistory}>
        {showHistory ? 'Hide History' : 'View History'}
      </button>

      <div className="response-container">
        <h2>{showHistory ? 'Chat History:' : 'Response:'}</h2>
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : showHistory ? (
          <ul>
            {history.map((chat, index) => (
              <li key={index}>
                <strong>Q:</strong> {chat.user_question}
                <br />
                <strong>A:</strong> {chat.response_text}
                <button className='del-btn' onClick={() => deleteChat(chat.id)}>Delete</button>
                <p>____________________________________________________________________________________________________________</p>
              </li>
            ))}
          </ul>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: formatResponse(responseText) }} />
        )}
      </div>

      {responseText && !loading && !showHistory && (
        <div className="button-group">
          <button onClick={readAloud} title="Read Aloud">
            <i className="fas fa-volume-up"></i>
          </button>
          <button onClick={stopReading} title="Stop">
            <i className="fas fa-stop"></i>
          </button>
          <button onClick={copyResponse} title="Copy Response">
            <i className="fas fa-copy"></i>
          </button>
          <button onClick={clearText} title="Clear Text">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
