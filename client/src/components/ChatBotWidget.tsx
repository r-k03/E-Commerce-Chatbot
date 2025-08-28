import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa';
import axios from 'axios';


// Type for message objects
interface Message {
  text: string
  isAgent: boolean
  threadId?: string
}

// Type for API response
interface ApiResponse {
  response: string
  threadId: string
}


const ChatBotWidget = () => {
  // State to track if chat window is open or closed
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // State to store all chat messages (array of message objects)
  const [messages, setMessages] = useState<Message[]>([]);
  // State to track current input field value
  const [inputValue, setInputValue] = useState<string>('');
  // State to store conversation thread ID (null for new conversations)
  const [threadId, setThreadId] = useState<string | null>(null);
  // Ref to reference the bottom of messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show initial greeting when chat is first opened
  useEffect(() => {
    // Only run if chat is open AND no messages exist yet
    if (isOpen && messages.length === 0) {
      const initialMessages: Message[] = [
        {
          text: "Hello! I'm your shopping assistant. How can I help you today?", // Greeting text
          isAgent: true
        }
      ];
      setMessages(initialMessages);
    }
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to toggle chat window open/closed
  const toggleChat = (): void => {
    setIsOpen(!isOpen);
  }

  // Function to handle changes in the input field
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  }
  
  // Function to send user message and get AI response
  const handleSendMessage = async (e : FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Create message object for user's input
    const message : Message = {
      text: inputValue,
      isAgent: false,
    }

    // Add user message to messages array using spread operator
    setMessages(prevMessages => [...prevMessages, message]);
    // Clear input field immediately after sending
    setInputValue("");

    // Determine API endpoint: use existing thread if available, otherwise create new
    const endpoint = threadId ? `http://localhost:5000/chat/${threadId}` : 'http://localhost:5000/chat';

    try {
      // Make HTTP POST request to backend API
      const response = await axios.post<ApiResponse>(endpoint, {message: inputValue});
      const data: ApiResponse = response.data;
      
      // Create message object for AI agent's response
      const agentResponse: Message = {
        text: data.response,
        isAgent: true,
        threadId: data.threadId
      }
      
      // Add AI response to messages array
      setMessages(prevMessages => [...prevMessages, agentResponse]);
      // Update thread ID for future messages in this conversation
      setThreadId(data.threadId);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Render the chat widget UI
  return (
    // Main container with conditional CSS class based on open/closed state
    <div className={`chat-widget-container ${isOpen ? 'open' : ''}`}>
      {/* Conditional rendering: show chat interface if open, otherwise show chat button */}
      {isOpen ? (
        <>
          {/* Chat header with title and close button */}
          <div className="chat-header">
            <div className="chat-title">
              {/* Robot icon */}
              <FaRobot />
              {/* Chat title text */}
              <h3>Shop Assistant</h3>
            </div>
            {/* Close button with X icon */}
            <button className="close-button" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>

          {/* Messages container */}
          <div className="chat-messages">
            {/* Map through messages array to render each message */}
            {messages.map((message, index) => (
              <div key={index}>
                <div className={`message ${message.isAgent ? 'message-bot' : 'message-user'}`}>
                  {message.text}
                </div>
              </div>
            ))}

            {/* Invisible div at bottom for auto-scroll reference */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form for sending messages */}
          <form className="chat-input-container" onSubmit={handleSendMessage}>
            {/* Text input field */}
            <input
              type="text"
              className="message-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={handleInputChange}
            />
            {/* Send button */}
            <button
              type="submit"
              className="send-button"
              disabled={inputValue.trim() === ''}
            >
              {/* Paper plane icon for send button */}
              <FaPaperPlane size={16} />
            </button>
          </form>
        </>
      ) : (
        /* Chat toggle button (shown when chat is closed) */
        <button className="chat-button" onClick={toggleChat}>
          {/* Comment/chat icon */}
          <FaCommentDots />
        </button>
      )}
    </div>
  )
}

export default ChatBotWidget