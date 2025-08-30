 # E-Commerce Store Chatbot

An e-commerce furniture store with an intelligent AI chatbot assistant built with React, Node.js, LangChain, LangGraph, and Google's Gemini AI. The website features a modern dark-themed UI with neon green accents and uses MongoDB Atlas for vector search capabilities and conversation persistence.

## Features

### Backend Features
- **Intelligent Furniture Search**: Vector-based search through furniture inventory using Google's text-embedding-004 model
- **Conversational AI**: Powered by Gemini-1.5-Flash for natural language understanding
- **Persistent Conversations**: Chat history stored in MongoDB with conversation threading
- **Fallback Search**: Automatic text-based search when vector search fails
- **Rate Limiting**: Built-in exponential backoff for API rate limiting
- **RESTful API**: Express.js server with CORS support

### Frontend Features
- **Modern E-commerce UI**: Dark theme with neon green colors
- **Interactive Chat Widget**: Floating chat bot with smooth animations
- **Real-time Chat**: Seamless conversation flow with the AI assistant

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite**
- **React Icons**
- **Axios**
- **CSS3**

### Backend
- **Node.js** + **TypeScript** + **Express.js**
- **LangChain** + **LangGraph** for AI workflow management
- **Google Gemini AI** for language processing
- **MongoDB Atlas** with vector search capabilities

## LangGraph Workflow
1. **User Input**: Receive customer message via React frontend
2. **Tool Decision**: Determine if inventory search is needed
3. **Vector Search**: Query furniture database using embeddings
4. **Text Fallback**: Use regex search if vector search fails
5. **Response Generation**: Create helpful, contextual response
6. **State Persistence**: Save conversation to MongoDB
7. **Frontend Update**: Display response in chat widget

## Error Handling
- **Rate Limiting**: Exponential backoff for API limits (429 errors)
- **Authentication**: Graceful handling of API key issues (401 errors)
- **Database Errors**: Fallback to text search when vector search fails
- **Empty Inventory**: Informative messages when no items found