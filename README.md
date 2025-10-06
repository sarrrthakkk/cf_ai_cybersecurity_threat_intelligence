# AI-Powered Cybersecurity Threat Intelligence Platform

https://github.com/user-attachments/assets/d765f83c-a302-4b13-9edf-c4cac7be278a



A cutting-edge AI-driven cybersecurity platform built on Cloudflare's edge infrastructure that provides real-time threat analysis, intelligent threat hunting, and automated security operations through conversational AI.

## 🚀 Features

- **Conversational Threat Analysis**: Chat with AI to analyze threats using natural language
- **Real-Time Threat Intelligence**: Live threat updates from NVD (National Vulnerability Database)
- **AI-Powered Threat Analysis**: Intelligent threat pattern recognition and analysis
- **Modern Chat Interface**: Professional cybersecurity UI with typing animations
- **Threat Dashboard**: Real-time threat statistics and recent threat display
- **Threat Ingestion**: Submit and analyze custom threat data
- **Responsive Design**: Works seamlessly across all devices

## 🏗 Architecture

### Core Components

- **Frontend**: Single-page application with modern chat interface
- **AI Processing**: Llama 3.1 8B via Cloudflare Workers AI for threat analysis
- **Threat Database**: Durable Objects for persistent threat intelligence storage
- **Real-time Updates**: Live threat feed with caching mechanism
- **External APIs**: Integration with NVD for real-world CVE data

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Cloudflare Workers, Durable Objects
- **AI**: Llama 3.1 8B via Workers AI
- **Real-time**: WebSocket connections for live updates
- **Deployment**: Cloudflare Workers with Durable Objects
- **External APIs**: NVD (National Vulnerability Database)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Cloudflare account with Workers AI enabled
- Wrangler CLI installed (`npm install -g wrangler`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cf_ai_cybersecurity_threat_intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Cloudflare**
   ```bash
   wrangler login
   wrangler whoami
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your Cloudflare account details
   ```

5. **Start local development**
   ```bash
   wrangler dev --local
   ```

6. **Deploy to production**
   ```bash
   wrangler deploy
   ```

### Local Development

1. **Start local development server**
   ```bash
   wrangler dev --local
   ```

2. **Open your browser**
   Navigate to `http://localhost:8787` to access the application

## 🎯 Usage Examples

### Chat Interface
```
User: "Analyze this suspicious IP: 192.168.1.100"
AI: "I've analyzed IP 192.168.1.100. Here's what I found:
     - Risk Level: Medium
     - Threat Type: Potential Botnet Node
     - Recommendations: Block traffic, investigate further
     - Related Threats: 3 similar IPs detected in past 24h"
```

### Threat Analysis
- "Check this domain: example.com"
- "Analyze this malware hash: abc123..."
- "What are the latest vulnerabilities?"
- "Create an incident response plan"

### Quick Actions
- **Analyze IP**: Quick IP address analysis
- **Scan Domain**: Domain reputation check
- **Hash Analysis**: Malware hash analysis
- **Submit Threat**: Submit custom threat data

## 🔧 Configuration

### Environment Variables

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# AI Configuration
AI_MODEL=@cf/meta/llama-3.1-8b-instruct
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.7

# Threat Intelligence
THREAT_FEED_UPDATE_INTERVAL=300000
MAX_THREAT_ANALYSIS_TIME=30000
```

### Wrangler Configuration

The `wrangler.toml` file contains all necessary configuration for:
- Workers AI model settings
- Durable Objects bindings (ThreatDatabase, SessionManager, WorkflowEngine)
- Environment variables
- Worker entry point (`main-simple.js`)

## 📊 API Endpoints

### Core APIs
- `POST /api/chat` - Chat with AI for threat analysis
- `GET /api/threats/feed` - Get real-time threat feed from NVD
- `POST /api/threats/analyze` - Analyze specific threat data
- `POST /api/threats/ingest` - Submit custom threat data
- `WebSocket /ws/threats` - Real-time threat updates

### Frontend Routes
- `GET /` - Main application interface
- `GET /styles.css` - Application styles
- `GET /js/app.js` - Application JavaScript

## 🎨 UI Features

### Modern Interface
- **Dark Theme**: Professional cybersecurity aesthetic
- **Chat Interface**: Real-time conversation with AI
- **Typing Animation**: Visual feedback during AI processing
- **Threat Dashboard**: Live statistics and recent threats
- **Analysis Panel**: Detailed threat analysis results
- **Quick Actions**: One-click threat analysis tools

### Responsive Design
- **Desktop**: Full-featured interface with sidebar
- **Tablet**: Optimized layout for touch devices
- **Mobile**: Streamlined mobile experience

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized
- **CORS Protection**: Proper CORS headers for API security
- **Rate Limiting**: Built-in protection against abuse
- **Data Validation**: Comprehensive input validation
- **Error Handling**: Secure error responses

## 📈 Performance Metrics

- **Response Time**: < 2s for AI threat analysis
- **Threat Feed**: Updates every 30 minutes with caching
- **Global Latency**: < 50ms worldwide via Cloudflare edge
- **Concurrent Users**: Supports multiple simultaneous users

## 🤖 AI Capabilities

### Specialized Prompts
- **IP Analysis**: Detailed IP reputation and threat analysis
- **Domain Analysis**: Domain reputation and security assessment
- **Malware Analysis**: Hash analysis and threat classification
- **Incident Response**: Structured incident response guidance
- **General Cybersecurity**: Comprehensive security advice

### AI Features
- **Contextual Responses**: AI adapts to query type
- **Professional Tone**: Polite and attentive communication
- **Structured Output**: Organized analysis results
- **Follow-up Suggestions**: Relevant next steps

## 🗂 Project Structure

```
cf_ai_cybersecurity_threat_intelligence/
├── src/
│   ├── workers/
│   │   └── main-simple.js      # Main worker with inlined frontend
│   ├── durable-objects/
│   │   ├── threat-database.js  # Threat data storage
│   │   ├── session-manager.js  # Session management
│   │   └── workflow-engine.js  # Workflow processing
│   └── tests/
│       └── test-suite.js       # Test suite
├── wrangler.toml               # Cloudflare configuration
├── package.json                # Dependencies and scripts
├── .env.example               # Environment variables template
├── deploy.sh                   # Deployment script
├── README.md                   # This file
├── PROMPTS.md                  # AI prompts documentation
└── LOCAL-DEVELOPMENT.md        # Development guide
```

## 🚀 Deployment

### Local Development
```bash
wrangler dev --local
```

### Production Deployment
```bash
wrangler deploy
```

### Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit with your Cloudflare credentials
# Deploy with your configuration
wrangler deploy
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The test suite covers:
- Durable Object functionality
- API endpoint testing
- Threat data processing
- Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Cloudflare for providing the amazing edge computing platform
- NVD (National Vulnerability Database) for threat intelligence data
- The cybersecurity community for threat intelligence feeds
- Open source AI models and libraries

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact: [msarthak2199@gmail.com]
- Documentation: See LOCAL-DEVELOPMENT.md for detailed setup

---

**Built with ❤️ for the Cloudflare Internship Program**

## 🔄 Recent Updates

- ✅ **Real AI Integration**: Now uses Cloudflare Workers AI with Llama 3.1 8B
- ✅ **NVD Integration**: Real-world CVE data from National Vulnerability Database
- ✅ **Modern UI**: Professional chat interface with typing animations
- ✅ **Threat Dashboard**: Live threat statistics and recent threat display
- ✅ **Caching System**: 30-minute cache for threat feed optimization
- ✅ **Clean Architecture**: Simplified to main-simple.js with inlined frontend
