from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from langchain_groq import ChatGroq
from langchain.schema import AIMessage, HumanMessage, SystemMessage

groq_api_key = os.getenv('GROQ_API_KEY')
llm = ChatGroq(groq_api_key=groq_api_key, model="Gemma-7b-It")

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///chat.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_question = db.Column(db.String, nullable=False)
    response_text = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "Welcome to the Chatbot API!"

@app.route('/saveChat', methods=['POST'])
def save_chat():
    data = request.json
    new_chat = Chat(user_question=data['userQuestion'], response_text=data['responseText'])
    db.session.add(new_chat)
    db.session.commit()
    return jsonify({'message': 'Chat saved successfully'}), 200

@app.route('/chatHistory', methods=['GET'])
def chat_history():
    chats = Chat.query.order_by(Chat.created_at.desc()).all()
    return jsonify([{'id': chat.id, 'user_question': chat.user_question, 'response_text': chat.response_text} for chat in chats])

@app.route('/deleteChat/<int:id>', methods=['DELETE'])
def delete_chat(id):
    chat_to_delete = Chat.query.get(id)
    if chat_to_delete:
        db.session.delete(chat_to_delete)
        db.session.commit()
        return jsonify({'message': 'Chat deleted successfully'}), 200
    return jsonify({'message': 'Chat not found'}), 404

@app.route('/generateAnswer', methods=['POST'])
def generate_answer():
    data = request.json
    user_question = data.get('inputs', '')

    # Prepare the chat message for answering the user's question
    chat_message = [
        SystemMessage(content="You are an AI that provides informative answers to user questions."),
        HumanMessage(content=user_question)  # Directly use the user's question
    ]

    try:
        answer = llm(chat_message).content  # Get the answer from the model
        return jsonify({'generated_text': answer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
