# JARVIS - AI Voice Assistant

A modern, intelligent voice assistant built with React, TypeScript, and advanced web technologies. JARVIS provides voice-controlled interactions, automation capabilities, and a beautiful user interface.

## ✨ Features

- 🎤 **Voice Recognition** - Advanced speech-to-text using Web Speech API
- 🔊 **Text-to-Speech** - Natural voice responses with customizable settings
- 🤖 **AI Responses** - Intelligent conversation handling with personality
- 🌐 **Web Integration** - Open websites, search Google, YouTube integration
- 📰 **News & Information** - Real-time news, weather, Wikipedia lookups
- 🧮 **Calculator** - Advanced mathematical calculations
- 💱 **Currency Conversion** - Real-time exchange rates
- 📚 **Dictionary** - Word definitions and meanings
- 🎯 **Productivity Tools** - Motivational quotes, productivity tips
- 🎉 **Birthday System** - Special celebrations and confetti
- 💾 **Message Persistence** - Optional Supabase integration
- 🎨 **Multiple Themes** - Cyber, Minimal, and Matrix themes
- 📱 **PWA Support** - Install as a desktop/mobile app

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with Web Speech API support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jarvis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys (optional)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Required: OpenAI for intelligent responses
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here

# Optional: Supabase for message persistence
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Backend automation token
AUTOMATION_TOKEN=your_secure_token

# Optional: API keys for enhanced features
VITE_WEATHER_API_KEY=your_weather_api_key
VITE_NEWS_API_KEY=your_news_api_key
```

**Important:** Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys) to enable intelligent responses. Without this, JARVIS will use basic pattern matching.

### Backend Server (Optional)

For PC automation features, run the Python Flask server:

```bash
cd server
python app.py
```

## 🎯 Usage

### Voice Commands

- **"Hello"** - Greet JARVIS
- **"What time is it?"** - Get current time
- **"Open YouTube"** - Open websites
- **"Search for [query]"** - Google search
- **"Calculate 15% of 200"** - Mathematical calculations
- **"What's the weather?"** - Weather information
- **"Tell me a joke"** - Entertainment
- **"Motivate me"** - Motivational quotes
- **"News headlines"** - Latest news

### Manual Input

Click the text input field to type commands instead of using voice.

## 🏗️ Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── constants/          # App constants and configurations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test setup and utilities
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🎨 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Git Hooks

Husky is configured to run linting and formatting on commit:

```bash
# Install git hooks
npm run prepare
```

## 📦 Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security

- All external API calls are properly validated
- No sensitive data is stored in localStorage
- CORS is configured for backend communication
- Environment variables are used for sensitive configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Badmus Qudus Ayomide**
- Creator and maintainer of JARVIS AI Assistant

## 🙏 Acknowledgments

- Web Speech API for voice capabilities
- React team for the amazing framework
- Vite for lightning-fast development
- All contributors and users of this project
