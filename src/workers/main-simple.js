// Main Worker Entry Point
import { ThreatDatabase } from '../durable-objects/threat-database.js';
import { SessionManager } from '../durable-objects/session-manager.js';
import { WorkflowEngine } from '../durable-objects/workflow-engine.js';

// Export Durable Objects
export { ThreatDatabase, SessionManager, WorkflowEngine };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route requests to appropriate handlers
      switch (path) {
        case '/':
          return handleFrontend(request, env, corsHeaders);
        
        case '/styles.css':
          return handleCSS(request, env, corsHeaders);
        
        case '/js/app.js':
          return handleJS(request, env, corsHeaders);
        
        case '/api/chat':
          return handleChat(request, env, corsHeaders);
        
        case '/api/threats/analyze':
          return handleThreatAnalysis(request, env, corsHeaders);
        
        case '/api/threats/feed':
          return handleThreatFeed(request, env, corsHeaders);
        
        case '/api/threats/ingest':
          return handleThreatIngest(request, env, corsHeaders);
        
        case '/api/workflows/trigger':
          return handleWorkflowTrigger(request, env, corsHeaders);
        
        case '/ws/threats':
          return handleWebSocket(request, env);
        
        default:
          return new Response('Not Found', { 
            status: 404, 
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

// Enhanced frontend handler
async function handleFrontend(request, env, corsHeaders) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>CyberThreat AI</title>
  <link rel="stylesheet" href="/styles.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">
        <i class="fas fa-shield-alt"></i>
        <h1>CyberThreat AI</h1>
      </div>
      <div class="status">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText">Connected</span>
      </div>
    </header>
    
    <div class="main-content">
      <aside class="sidebar">
        <div class="section">
          <h3>Threat Dashboard</h3>
          <div class="stats">
            <div class="stat">
              <span class="stat-number" id="activeThreats">0</span>
              <span class="stat-label">Active Threats</span>
            </div>
            <div class="stat">
              <span class="stat-number" id="threatsToday">0</span>
              <span class="stat-label">Today</span>
            </div>
            <div class="stat">
              <span class="stat-number" id="riskLevel">Low</span>
              <span class="stat-label">Risk Level</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button class="action-btn" data-action="analyze-ip">
              <i class="fas fa-search"></i>
              Analyze IP
            </button>
            <button class="action-btn" data-action="scan-domain">
              <i class="fas fa-globe"></i>
              Scan Domain
            </button>
            <button class="action-btn" data-action="check-hash">
              <i class="fas fa-fingerprint"></i>
              Check Hash
            </button>
                        <button class="action-btn" data-action="generate-report">
                            <i class="fas fa-file-alt"></i>
                            Generate Report
                        </button>
                        <button class="action-btn" data-action="submit-threat">
                            <i class="fas fa-exclamation-triangle"></i>
                            Submit Threat
                        </button>
          </div>
        </div>
        
        <div class="section">
          <h3>Recent Threats</h3>
          <div class="recent-threats" id="recentThreats">
            <!-- Dynamic threat list will be populated here -->
          </div>
        </div>
      </aside>
      
      <main class="chat-section">
        <div class="chat-header">
          <h2>AI Threat Analyst</h2>
          <div class="chat-controls">
            <button id="clearChat" class="control-btn" title="Clear Chat">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="chat-messages" id="messages">
          <div class="message ai-message">
            <div class="message-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
              <div class="message-text">
                Welcome to CyberThreat AI! I'm your AI-powered cybersecurity analyst. 
                I can help you analyze threats, investigate incidents, and provide security recommendations.
                <br><br>
                <strong>What can I help you with today?</strong>
                <ul>
                  <li>Analyze suspicious IP addresses or domains</li>
                  <li>Investigate malware samples or file hashes</li>
                  <li>Generate security reports</li>
                  <li>Provide threat intelligence insights</li>
                </ul>
              </div>
              <div class="message-time">Just now</div>
            </div>
          </div>
        </div>
        
        <div class="input-area">
          <textarea id="messageInput" placeholder="Ask me about threats, analyze suspicious activity, or request security insights..." rows="3"></textarea>
          <button id="sendBtn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </main>
      
      <!-- Threat Analysis Panel -->
      <aside class="analysis-panel" id="analysisPanel" style="display: none;">
        <div class="panel-header">
          <h3>Threat Analysis</h3>
          <button id="closeAnalysis" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="panel-content" id="analysisContent">
          <!-- Dynamic analysis content -->
        </div>
      </aside>
    </div>
  </div>
  <script src="/js/app.js"></script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      ...corsHeaders
    }
  });
}

// Enhanced CSS handler
async function handleCSS(request, env, corsHeaders) {
  const css = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: white; }
.container { min-height: 100vh; display: flex; flex-direction: column; }
.header { background: #1a1a1a; padding: 1rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
.logo { display: flex; align-items: center; gap: 0.5rem; }
.logo i { color: #00d4ff; font-size: 1.5rem; }
.logo h1 { font-size: 1.5rem; font-weight: 600; }
.status { display: flex; align-items: center; gap: 0.5rem; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #00ff00; }
.main-content { flex: 1; display: grid; grid-template-columns: 300px 1fr; gap: 1rem; padding: 1rem; }
.main-content.with-analysis { grid-template-columns: 300px 1fr 300px; }
.sidebar { background: #1a1a1a; border-radius: 8px; padding: 1rem; }
.section { margin-bottom: 2rem; }
.section h3 { margin-bottom: 1rem; color: #00d4ff; }
.stats { display: grid; gap: 0.5rem; }
.stat { display: flex; justify-content: space-between; padding: 0.5rem; background: #2a2a2a; border-radius: 4px; }
.stat-number { font-weight: bold; color: #00d4ff; }
.quick-actions { display: grid; gap: 0.5rem; }
.action-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #2a2a2a; border: none; border-radius: 4px; color: white; cursor: pointer; transition: background 0.2s; }
.action-btn:hover { background: #3a3a3a; }
.chat-section { background: #1a1a1a; border-radius: 8px; display: flex; flex-direction: column; }
.chat-header { padding: 1rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
.chat-controls { display: flex; gap: 0.5rem; }
.control-btn { background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem; }
.control-btn:hover { color: white; }
.chat-messages { flex: 1; padding: 1rem; overflow-y: auto; }
.message { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
.message-avatar { width: 32px; height: 32px; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; }
.ai-message .message-avatar { background: #00d4ff; }
.user-message { flex-direction: row-reverse; }
.user-message .message-avatar { background: #666; }
.message-content { flex: 1; }
.message-text { background: #2a2a2a; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.25rem; }
.user-message .message-text { background: #0066cc; }
.message-time { font-size: 0.75rem; color: #999; }
.input-area { padding: 1rem; border-top: 1px solid #333; display: flex; gap: 0.5rem; }
#messageInput { flex: 1; padding: 0.75rem; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: white; resize: vertical; min-height: 60px; }
#messageInput:focus { outline: none; border-color: #00d4ff; }
#sendBtn { padding: 0.75rem 1rem; background: #00d4ff; border: none; border-radius: 4px; color: black; cursor: pointer; font-weight: 600; }
#sendBtn:hover { background: #00b8e6; }
#sendBtn:disabled { background: #666; cursor: not-allowed; }
.typing-indicator .message-text { background: #2a2a2a; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
.typing-animation { display: flex; gap: 4px; }
.typing-animation span { width: 8px; height: 8px; border-radius: 50%; background: #00d4ff; animation: typing 1.4s infinite ease-in-out; }
.typing-animation span:nth-child(1) { animation-delay: -0.32s; }
.typing-animation span:nth-child(2) { animation-delay: -0.16s; }
.typing-text { color: #999; font-style: italic; }
@keyframes typing { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
.threat-item { padding: 0.75rem; margin-bottom: 0.5rem; background: #2a2a2a; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
.threat-item:hover { background: #3a3a3a; }
.threat-item.high-risk { border-left: 3px solid #ff4444; }
.threat-item.critical-risk { border-left: 3px solid #ff0000; background: #2a1a1a; }
.threat-item.medium-risk { border-left: 3px solid #ffaa00; }
.threat-item.low-risk { border-left: 3px solid #00ff00; }
.threat-title { font-weight: 600; margin-bottom: 0.25rem; }
.threat-meta { font-size: 0.75rem; color: #999; margin-bottom: 0.25rem; }
.threat-description { font-size: 0.8rem; color: #ccc; }
.threat-details { padding: 1rem; }
.detail-item { margin-bottom: 0.75rem; }
.detail-item label { display: block; font-weight: 600; color: #00d4ff; margin-bottom: 0.25rem; }
.detail-item span { color: #fff; }
.detail-item p { margin: 0.25rem 0; color: #ccc; }
.detail-item ul { margin: 0.25rem 0; padding-left: 1rem; }
.detail-item li { color: #ccc; margin-bottom: 0.25rem; }
.tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.tag { background: #333; color: #00d4ff; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.75rem; }
.risk-high { color: #ff4444; }
.risk-critical { color: #ff0000; }
.risk-medium { color: #ffaa00; }
.risk-low { color: #00ff00; }
.data-sources { margin-top: 1rem; padding: 0.5rem; background: #2a2a2a; border-radius: 4px; }
.sources-label { font-size: 0.75rem; color: #999; margin-bottom: 0.25rem; }
.sources-list { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.source-tag { background: #333; color: #00d4ff; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.7rem; }
.cache-status { margin-top: 0.5rem; }
.cache-indicator { font-size: 0.7rem; color: #999; }
.cache-indicator.cached:before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.25rem; background: #ffaa00; }
.cache-indicator.live:before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.25rem; background: #00ff00; }
.recent-threats { max-height: 400px; overflow-y: auto; }
.threat-item { background: #2a2a2a; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; border-left: 3px solid #333; }
.threat-item:hover { background: #3a3a3a; }
.threat-item.critical-risk { border-left-color: #ff0000; }
.threat-item.high-risk { border-left-color: #ff4444; }
.threat-item.medium-risk { border-left-color: #ffaa00; }
.threat-item.low-risk { border-left-color: #00ff00; }
.threat-title { font-weight: 600; color: #fff; margin-bottom: 0.25rem; }
.threat-meta { font-size: 0.75rem; color: #999; margin-bottom: 0.5rem; }
.threat-description { font-size: 0.8rem; color: #ccc; line-height: 1.4; }
.analysis-panel { background: #1a1a1a; border-radius: 8px; padding: 1rem; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.panel-header h3 { color: #00d4ff; margin: 0; }
.close-btn { background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem; }
.close-btn:hover { color: #fff; }
.panel-content { max-height: 500px; overflow-y: auto; }
@media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } }`;

  return new Response(css, {
    headers: {
      'Content-Type': 'text/css',
      ...corsHeaders
    }
  });
}

// Enhanced JS handler
async function handleJS(request, env, corsHeaders) {
  const js = `console.log('CyberThreat AI JavaScript loaded');
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const messages = document.getElementById('messages');
  const clearBtn = document.getElementById('clearChat');
  
  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = \`message \${isUser ? 'user' : 'ai'}-message\`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = \`
      <div class="message-avatar">
        <i class="fas fa-\${isUser ? 'user' : 'robot'}"></i>
      </div>
      <div class="message-content">
        <div class="message-text">\${formatMessage(text)}</div>
        <div class="message-time">\${timeString}</div>
      </div>
    \`;
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  }
  
  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = \`
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="message-text">
          <div class="typing-animation">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">AI is analyzing your request...</span>
        </div>
      </div>
    \`;
    
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;
  }
  
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  function formatMessage(message) {
    return message
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
      .replace(/\`(.*?)\`/g, '<code>$1</code>')
      .replace(/\\n/g, '<br>');
  }
  
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    input.value = '';
    
    // Show typing indicator
    addTypingIndicator();
    
    // Disable send button while processing
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Send to API
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(res => res.json())
    .then(data => {
      // Remove typing indicator
      removeTypingIndicator();
      
      if (data.success) {
        addMessage(data.response);
      } else {
        addMessage('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      // Remove typing indicator
      removeTypingIndicator();
      addMessage('Error: ' + err.message);
    })
    .finally(() => {
      // Re-enable send button
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    });
  }
  
  function handleQuickAction(action) {
    const actions = {
      'analyze-ip': () => promptForInput('Enter IP address to analyze:', 'IP address'),
      'scan-domain': () => promptForInput('Enter domain to scan:', 'domain'),
      'check-hash': () => promptForInput('Enter file hash to check:', 'file hash'),
      'generate-report': () => generateSecurityReport(),
      'submit-threat': () => submitThreat()
    };
    
    if (actions[action]) {
      actions[action]();
    }
  }
  
  function promptForInput(message, type) {
    const input = window.prompt(message);
    if (input) {
      const composedMessage = \`Please analyze this \${type}: \${input}\`;
      document.getElementById('messageInput').value = composedMessage;
      sendMessage();
    }
  }
  
  function generateSecurityReport() {
    addMessage('Generating security report...', true);
    
    fetch('/api/workflows/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowType: 'incident-response',
        parameters: {
          reportType: 'security-summary',
          timeframe: '24h'
        }
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        addMessage(data.response);
      } else {
        addMessage('Failed to generate report: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      addMessage('Error generating report: ' + err.message);
    });
  }
  
  function submitThreat() {
    const threatType = window.prompt('Enter threat type (malware, phishing, ddos, botnet, ransomware, apt, insider):');
    if (!threatType) return;
    
    const indicators = window.prompt('Enter threat indicators (comma-separated):');
    if (!indicators) return;
    
    const description = window.prompt('Enter threat description (optional):') || '';
    const source = window.prompt('Enter threat source (optional):') || 'Manual Submission';
    
    const threatData = {
      type: threatType.toLowerCase(),
      indicators: indicators.split(',').map(i => i.trim()),
      description: description,
      source: source,
      confidence: 0.8
    };
    
    addMessage('Submitting threat data...', true);
    
    fetch('/api/threats/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(threatData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        addMessage(\`Threat successfully submitted! Threat ID: \${data.threatId}\`);
        // Refresh threat stats
        updateThreatStats();
      } else {
        addMessage('Failed to submit threat: ' + data.error);
      }
    })
    .catch(err => {
      addMessage('Error submitting threat: ' + err.message);
    });
  }
  
  function updateThreatStats() {
    console.log('Updating threat stats...');
    fetch('/api/threats/feed')
    .then(res => {
      console.log('Threat feed response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('Threat feed response data:', data);
      if (data.success) {
        const threats = data.threats || [];
        const metrics = data.metrics || {};
        
        console.log('Found', threats.length, 'threats');
        
        // Update dashboard metrics
        document.getElementById('activeThreats').textContent = metrics.activeThreats || 0;
        document.getElementById('threatsToday').textContent = metrics.todayThreats || 0;
        document.getElementById('riskLevel').textContent = metrics.riskLevel || 'Low';
        
        const riskElement = document.getElementById('riskLevel');
        riskElement.className = \`stat-number \${(metrics.riskLevel || 'low').toLowerCase()}-risk\`;
        
        // Update recent threats list
        console.log('Calling updateRecentThreatsList with', threats.slice(0, 10).length, 'threats');
        updateRecentThreatsList(threats.slice(0, 10));
        
          // Update data sources if available
          if (data.sources) {
            updateDataSources(data.sources, data.cached, data.timestamp);
          }
      } else {
        console.error('Threat feed returned success: false', data);
      }
    })
    .catch(err => {
      console.error('Failed to update threat stats:', err);
    });
  }
  
  function sanitizeText(text) {
    if (!text) return '';
    
    // Replace common encoding issues
    return text
      .replace(/â€¢/g, '-')  // Replace bullet character encoding issues
      .replace(/â€/g, '"')   // Replace smart quote encoding issues
      .replace(/â€™/g, "'")   // Replace apostrophe encoding issues
      .replace(/â€œ/g, '"')   // Replace opening quote encoding issues
      .replace(/â€/g, '"')    // Replace closing quote encoding issues
      .replace(/â€"/g, '–')   // Replace en dash encoding issues
      .replace(/â€"/g, '—')   // Replace em dash encoding issues
      .replace(/â€¦/g, '...')  // Replace ellipsis encoding issues
      .replace(/[^\x00-\x7F]/g, '') // Remove any remaining non-ASCII characters
      .trim();
  }
  
  function updateRecentThreatsList(threats) {
    const recentThreats = document.getElementById('recentThreats');
    
    recentThreats.innerHTML = '';
    
    threats.forEach(threat => {
      const threatDiv = document.createElement('div');
      threatDiv.className = \`threat-item \${threat.riskLevel || 'low'}-risk\`;
      threatDiv.innerHTML = \`
        <div class="threat-title">\${sanitizeText(threat.type || 'Unknown Threat')}</div>
        <div class="threat-meta">
          \${new Date(threat.timestamp).toLocaleString()} - 
          Risk: \${threat.riskLevel || 'Low'}
        </div>
        <div class="threat-description">\${sanitizeText(threat.description || '')}</div>
      \`;
      
      threatDiv.addEventListener('click', () => {
        showThreatDetails(threat);
      });
      
      recentThreats.appendChild(threatDiv);
    });
    
  }
  
  function updateDataSources(sources, cached = false, timestamp = null) {
    // Add data sources indicator to the dashboard
    const threatStats = document.querySelector('.threat-stats');
    if (threatStats && sources) {
      let sourcesElement = document.getElementById('dataSources');
      if (!sourcesElement) {
        sourcesElement = document.createElement('div');
        sourcesElement.id = 'dataSources';
        sourcesElement.className = 'data-sources';
        sourcesElement.innerHTML = \`
          <div class="sources-label">Data Sources:</div>
          <div class="sources-list"></div>
          <div class="cache-status"></div>
        \`;
        threatStats.appendChild(sourcesElement);
      }
      
      const sourcesList = sourcesElement.querySelector('.sources-list');
      sourcesList.innerHTML = sources.map(source => 
        \`<span class="source-tag">\${sanitizeText(source)}</span>\`
      ).join('');
      
      // Update cache status
      const cacheStatus = sourcesElement.querySelector('.cache-status');
      if (cached && timestamp) {
        const cacheTime = new Date(timestamp).toLocaleTimeString();
        cacheStatus.innerHTML = \`<span class="cache-indicator cached">📦 Cached at \${cacheTime}</span>\`;
      } else {
        cacheStatus.innerHTML = \`<span class="cache-indicator live">🔄 Live Data</span>\`;
      }
    }
  }
  
  function showThreatDetails(threat) {
    const analysisContent = document.getElementById('analysisContent');
    if (!analysisContent) return;
    
    analysisContent.innerHTML = \`
      <div class="threat-details">
        <h4>Threat Details</h4>
        <div class="detail-item">
          <label>Type:</label>
          <span>\${sanitizeText(threat.type || 'Unknown')}</span>
        </div>
        <div class="detail-item">
          <label>Risk Level:</label>
          <span class="risk-\${threat.riskLevel || 'low'}">\${threat.riskLevel || 'Low'}</span>
        </div>
        <div class="detail-item">
          <label>Status:</label>
          <span>\${sanitizeText(threat.status || 'Unknown')}</span>
        </div>
        <div class="detail-item">
          <label>Detected:</label>
          <span>\${new Date(threat.timestamp).toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <label>Source:</label>
          <span>\${sanitizeText(threat.source || 'Unknown')}</span>
        </div>
        \${threat.description ? \`
          <div class="detail-item">
            <label>Description:</label>
            <p>\${sanitizeText(threat.description)}</p>
          </div>
        \` : ''}
        \${threat.indicators ? \`
          <div class="detail-item">
            <label>Indicators:</label>
            <ul>
              \${threat.indicators.map(indicator => \`<li>\${sanitizeText(indicator)}</li>\`).join('')}
            </ul>
          </div>
        \` : ''}
        \${threat.tags ? \`
          <div class="detail-item">
            <label>Tags:</label>
            <div class="tags">
              \${threat.tags.map(tag => \`<span class="tag">\${sanitizeText(tag)}</span>\`).join('')}
            </div>
          </div>
        \` : ''}
      </div>
    \`;
    
    // Show analysis panel
    const panel = document.getElementById('analysisPanel');
    const mainContent = document.querySelector('.main-content');
    if (panel && mainContent) {
      panel.style.display = 'block';
      mainContent.classList.add('with-analysis');
    }
  }
  
  function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      messages.innerHTML = \`
        <div class="message ai-message">
          <div class="message-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="message-content">
            <div class="message-text">
              Chat history cleared. How can I help you with cybersecurity analysis today?
            </div>
            <div class="message-time">Just now</div>
          </div>
        </div>
      \`;
    }
  }
  
  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  clearBtn.addEventListener('click', clearChat);
  
  // Quick action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleQuickAction(action);
    });
  });
  
  // Close analysis panel button
  const closeAnalysisBtn = document.getElementById('closeAnalysis');
  if (closeAnalysisBtn) {
    closeAnalysisBtn.addEventListener('click', () => {
      const analysisPanel = document.getElementById('analysisPanel');
      const mainContent = document.querySelector('.main-content');
      if (analysisPanel && mainContent) {
        analysisPanel.style.display = 'none';
        mainContent.classList.remove('with-analysis');
      }
    });
  }
  
  // Initialize
  updateThreatStats();
  setInterval(updateThreatStats, 30000); // Update every 30 seconds
});`;

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      ...corsHeaders
    }
  });
}

// Real AI chat handler using Cloudflare Workers AI
async function handleChat(request, env, corsHeaders) {
  try {
    const { message } = await request.json();
    
    if (!message || message.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message cannot be empty'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Detect query type and create specialized prompt
    function createSpecializedPrompt(message) {
      const lowerMessage = message.toLowerCase();
      
      // Greeting and conversational queries (but not if it contains analysis requests)
      if ((lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || 
          lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || 
          lowerMessage.includes('good evening') || lowerMessage.includes('greetings') ||
          lowerMessage.includes('how are you') || lowerMessage.includes('what can you do')) &&
          !lowerMessage.includes('analyze') && !lowerMessage.includes('check') && !lowerMessage.includes('investigate')) {
        return {
          systemPrompt: `You are CyberThreat AI, a friendly and professional cybersecurity analyst with 15+ years of experience. You are polite, attentive, and genuinely helpful.

PERSONALITY TRAITS:
- Warm and professional greeting style
- Attentive listener who acknowledges user concerns
- Encouraging and supportive tone
- Clear, jargon-free explanations when needed
- Proactive in offering relevant assistance

COMMUNICATION STYLE:
- Start with a warm, personalized greeting
- Acknowledge the user's query specifically
- Show genuine interest in helping with their cybersecurity needs
- Offer relevant capabilities and next steps
- Maintain professional expertise while being approachable

CAPABILITIES TO HIGHLIGHT:
- Threat analysis and intelligence
- Incident response planning
- Vulnerability assessments
- Security recommendations
- Compliance guidance
- Risk management

Always be encouraging and make users feel confident about their security posture.`,
          userPrompt: `User Query: "${message}"

Please provide a warm, professional greeting and overview of how you can help with their cybersecurity needs. Be specific about your capabilities and ask how you can assist them today.`
        };
      }
      
      // IP Analysis Query
      if (lowerMessage.includes('ip') && (lowerMessage.includes('analyze') || lowerMessage.includes('check') || lowerMessage.includes('investigate'))) {
        return {
          systemPrompt: `You are a friendly and professional cybersecurity network analyst specializing in IP reputation analysis, network forensics, and threat intelligence. You are polite, attentive, and genuinely helpful.

COMMUNICATION APPROACH:
- Start with acknowledgment of their IP analysis request
- Show understanding of their security concerns
- Provide detailed, comprehensive analysis
- Be encouraging about their proactive security approach
- Offer clear next steps and ongoing support

ANALYSIS FRAMEWORK FOR IP ADDRESSES:
1. REPUTATION CHECK: Check against known threat intelligence feeds
2. GEOGRAPHIC ANALYSIS: Location, ISP, and hosting provider analysis
3. HISTORICAL ACTIVITY: Past malicious activities and associations
4. NETWORK BEHAVIOR: Port scanning, service enumeration, traffic patterns
5. THREAT CORRELATION: Links to known threat actors or campaigns
6. RISK ASSESSMENT: Current threat level and business impact
7. MONITORING RECOMMENDATIONS: Ongoing surveillance and alerting

TOOLS TO REFERENCE:
- VirusTotal, AbuseIPDB, Shodan
- Threat intelligence feeds (MISP, OpenCTI)
- Network monitoring tools (Wireshark, Zeek)
- SIEM platforms for correlation

Provide specific, actionable intelligence with concrete next steps while maintaining a supportive tone.`,
          userPrompt: `IP ADDRESS ANALYSIS REQUEST:

User Query: "${message}"

I understand you'd like me to analyze this IP address for potential security concerns. That's a great proactive approach to cybersecurity! Let me provide you with a comprehensive analysis including:

- Reputation assessment and threat level
- Geographic and hosting information  
- Historical malicious activities
- Network behavior analysis
- Risk assessment and business impact
- Specific monitoring and mitigation recommendations
- Tools and techniques for ongoing surveillance

I'll format this with clear sections and actionable recommendations to help you make informed security decisions.`
        };
      }
      
      // Domain Analysis Query
      if (lowerMessage.includes('domain') && (lowerMessage.includes('analyze') || lowerMessage.includes('check') || lowerMessage.includes('scan'))) {
        return {
          systemPrompt: `You are a friendly and professional cybersecurity domain analyst specializing in DNS analysis, domain reputation, and web security. You are polite, attentive, and genuinely helpful.

COMMUNICATION APPROACH:
- Start with acknowledgment of their domain analysis request
- Show understanding of their security concerns
- Provide detailed, comprehensive analysis
- Be encouraging about their proactive security approach
- Offer clear next steps and ongoing support

ANALYSIS FRAMEWORK FOR DOMAINS:
1. DOMAIN REPUTATION: Check against malware and phishing databases
2. DNS ANALYSIS: DNS records, subdomains, and infrastructure mapping
3. SSL/TLS ANALYSIS: Certificate validity, encryption strength, vulnerabilities
4. WEB APPLICATION SECURITY: Common vulnerabilities and attack vectors
5. HISTORICAL ACTIVITY: Past malicious activities and takedowns
6. INFRASTRUCTURE ANALYSIS: Hosting, CDN, and network infrastructure
7. THREAT CORRELATION: Links to threat actors, campaigns, or malware

TOOLS TO REFERENCE:
- VirusTotal, URLVoid, PhishTank
- DNS analysis tools (dig, nslookup, DNSdumpster)
- SSL Labs, Qualys SSL Test
- Web security scanners (OWASP ZAP, Burp Suite)

Provide detailed technical analysis with specific security recommendations while maintaining a supportive tone.`,
          userPrompt: `DOMAIN ANALYSIS REQUEST:

User Query: "${message}"

I understand you'd like me to analyze this domain for potential security concerns. That's excellent proactive security thinking! Let me provide you with a comprehensive domain analysis including:

- Domain reputation and threat assessment
- DNS infrastructure analysis
- SSL/TLS security evaluation
- Web application security assessment
- Historical malicious activity review
- Infrastructure and hosting analysis
- Specific security recommendations and monitoring

I'll include technical details and actionable security measures to help you make informed decisions about this domain.`
        };
      }
      
      // Malware/Hash Analysis Query
      if (lowerMessage.includes('hash') || lowerMessage.includes('malware') || lowerMessage.includes('file') || lowerMessage.includes('sample')) {
        return {
          systemPrompt: `You are a friendly and professional cybersecurity malware analyst specializing in static and dynamic analysis, reverse engineering, and threat intelligence. You are polite, attentive, and genuinely helpful.

COMMUNICATION APPROACH:
- Start with acknowledgment of their malware/hash analysis request
- Show understanding of their security concerns
- Provide detailed, comprehensive analysis
- Be encouraging about their proactive security approach
- Offer clear next steps and ongoing support

ANALYSIS FRAMEWORK FOR MALWARE/HASHES:
1. HASH REPUTATION: Check against malware databases and threat feeds
2. STATIC ANALYSIS: File properties, strings, imports, and metadata
3. DYNAMIC ANALYSIS: Behavioral analysis and network activity
4. FAMILY CLASSIFICATION: Malware family, variant, and capabilities
5. IOC EXTRACTION: Network indicators, file system changes, registry modifications
6. ATTACK VECTOR: Delivery method, exploitation techniques, persistence
7. MITIGATION STRATEGY: Detection, prevention, and response measures

TOOLS TO REFERENCE:
- VirusTotal, Hybrid Analysis, Any.run
- Static analysis tools (PEiD, Detect It Easy)
- Dynamic analysis sandboxes (Cuckoo, CAPE)
- Threat intelligence platforms (MISP, OpenCTI)

Provide detailed technical analysis with specific detection and prevention recommendations while maintaining a supportive tone.`,
          userPrompt: `MALWARE/HASH ANALYSIS REQUEST:

User Query: "${message}"

I understand you'd like me to analyze this malware sample or hash for potential security threats. That's excellent proactive security work! Let me provide you with a comprehensive analysis including:

- Hash reputation and threat classification
- Static analysis findings
- Behavioral analysis and capabilities
- Malware family identification
- IOC extraction and correlation
- Attack vector and delivery method
- Detection signatures and prevention measures
- Incident response recommendations

I'll include technical details and specific security controls to help you understand and defend against this threat.`
        };
      }
      
      // Incident Response Query
      if (lowerMessage.includes('incident') || lowerMessage.includes('breach') || lowerMessage.includes('attack') || lowerMessage.includes('response')) {
        return {
          systemPrompt: `You are a friendly and professional cybersecurity incident response specialist with expertise in digital forensics, threat hunting, and crisis management. You are polite, attentive, and genuinely helpful.

COMMUNICATION APPROACH:
- Start with acknowledgment of their incident response request
- Show understanding of their urgent security concerns
- Provide detailed, comprehensive guidance
- Be encouraging about their proactive response approach
- Offer clear next steps and ongoing support
- Maintain calm, professional tone during crisis situations

INCIDENT RESPONSE FRAMEWORK:
1. IMMEDIATE ASSESSMENT: Scope, impact, and severity evaluation
2. CONTAINMENT STRATEGY: Immediate isolation and damage limitation
3. INVESTIGATION PLAN: Evidence collection and forensic analysis
4. THREAT HUNTING: Active threat detection and eradication
5. COMMUNICATION PLAN: Stakeholder notification and public relations
6. RECOVERY STRATEGY: System restoration and business continuity
7. POST-INCIDENT ANALYSIS: Lessons learned and security improvements

FRAMEWORKS TO REFERENCE:
- NIST Cybersecurity Framework
- SANS Incident Response Process
- MITRE ATT&CK for threat modeling
- ISO 27035 for incident management

Provide structured, actionable guidance with specific timelines and responsibilities while maintaining a supportive, reassuring tone.`,
          userPrompt: `INCIDENT RESPONSE REQUEST:

User Query: "${message}"

I understand you're dealing with a security incident and need immediate guidance. That's exactly the right approach - taking swift action is crucial! Let me provide you with a comprehensive incident response plan including:

- Immediate assessment and containment strategy
- Investigation and forensic analysis plan
- Threat hunting and eradication steps
- Communication and notification procedures
- Recovery and business continuity measures
- Post-incident analysis and improvements
- Compliance and regulatory considerations
- Resource requirements and timelines

I'll structure this as an actionable incident response playbook to help you navigate this situation effectively and minimize impact.`
        };
      }
      
      // Default general cybersecurity prompt
      return {
        systemPrompt: `You are CyberThreat AI, a friendly and professional cybersecurity analyst and threat intelligence specialist with 15+ years of experience in enterprise security, incident response, and threat hunting. You are polite, attentive, and genuinely helpful.

PERSONALITY TRAITS:
- Warm and professional communication style
- Attentive listener who acknowledges user concerns
- Encouraging and supportive tone
- Clear, jargon-free explanations when needed
- Proactive in offering relevant assistance
- Genuinely interested in helping users improve their security posture

CORE CAPABILITIES:
- Threat intelligence analysis and correlation
- Incident response planning and execution
- Vulnerability assessment and risk management
- Malware analysis and reverse engineering
- Network security and forensics
- Compliance and regulatory frameworks (SOC2, ISO27001, NIST)

RESPONSE FRAMEWORK:
1. IMMEDIATE ASSESSMENT: Quick threat level evaluation (Low/Medium/High/Critical)
2. TECHNICAL ANALYSIS: Detailed technical breakdown with specific indicators
3. BUSINESS IMPACT: Risk assessment with potential business consequences
4. ACTIONABLE RECOMMENDATIONS: Specific, prioritized steps with timelines
5. PREVENTION STRATEGIES: Long-term security improvements
6. COMPLIANCE CONSIDERATIONS: Relevant regulatory and compliance aspects

COMMUNICATION STYLE:
- Start with acknowledgment of their query
- Show understanding of their security concerns
- Professional yet accessible language
- Use specific technical terms with brief explanations
- Provide concrete examples and references
- Include relevant threat intelligence sources when applicable
- Always prioritize actionable intelligence over theoretical concepts
- Be encouraging about their proactive security approach

If uncertain about any aspect, clearly state limitations and suggest verification steps.`,
        userPrompt: `CYBERSECURITY QUERY ANALYSIS:

User Query: "${message}"

I understand you have a cybersecurity question or concern, and I'm here to help! That's great that you're being proactive about security. Let me provide you with a comprehensive analysis following our framework:

- Immediate threat assessment
- Technical analysis with specific indicators
- Business impact evaluation
- Prioritized action items
- Prevention recommendations
- Relevant compliance considerations

I'll format my response with clear headings and bullet points for easy scanning, and I'm here to clarify anything or provide additional guidance as needed.`
      };
    }

    const { systemPrompt, userPrompt } = createSpecializedPrompt(message);

    // Call Cloudflare Workers AI
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: parseInt(env.AI_MAX_TOKENS) || 2048,
      temperature: parseFloat(env.AI_TEMPERATURE) || 0.7
    });

    // Extract the response text
    const response = aiResponse.response || aiResponse.text || 'I apologize, but I was unable to generate a response. Please try again.';
    
    return new Response(JSON.stringify({
      success: true,
      response: response,
      model: '@cf/meta/llama-3.1-8b-instruct',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Fallback response if AI fails
    const fallbackResponse = `I apologize, but I'm experiencing technical difficulties with the AI service. Error: ${error.message}. Please try again in a moment.`;
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      response: fallbackResponse
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Real threat analysis handler using AI
async function handleThreatAnalysis(request, env, corsHeaders) {
  try {
    const { threatData } = await request.json();
    
    if (!threatData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Threat data is required'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Enhanced threat analysis prompt
    const systemPrompt = `You are a senior cybersecurity threat analyst specializing in threat intelligence, incident response, and digital forensics.

ANALYSIS FRAMEWORK:
1. THREAT CLASSIFICATION: Categorize using MITRE ATT&CK, NIST, or industry standards
2. SEVERITY ASSESSMENT: CVSS scoring, business impact, and likelihood
3. IOC EXTRACTION: Identify and prioritize indicators of compromise
4. ATTACK VECTOR ANALYSIS: Determine entry points and propagation methods
5. IMPACT ASSESSMENT: Business, technical, and operational consequences
6. MITIGATION STRATEGY: Immediate containment and long-term prevention
7. INVESTIGATION ROADMAP: Next steps for threat hunting and forensics

OUTPUT REQUIREMENTS:
- Use structured format with clear sections
- Include specific technical details and references
- Provide actionable recommendations with priorities
- Reference relevant threat intelligence sources
- Include compliance and regulatory considerations
- Suggest tools and techniques for verification

COMMUNICATION:
- Professional, technical, yet accessible
- Include specific examples and case studies
- Provide concrete timelines and resource requirements
- Always include uncertainty disclaimers where appropriate`;

    const userPrompt = `THREAT DATA ANALYSIS REQUEST:

Threat Data to Analyze:
${JSON.stringify(threatData, null, 2)}

Please provide a comprehensive threat analysis report following the framework above. Structure your response with:
- Executive Summary (2-3 sentences)
- Detailed Technical Analysis
- Risk Assessment and Impact
- Immediate Action Items
- Long-term Mitigation Strategy
- Investigation Recommendations
- Compliance Considerations

Include specific tools, techniques, and references where applicable.`;

    // Call Cloudflare Workers AI
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: parseInt(env.AI_MAX_TOKENS) || 2048,
      temperature: parseFloat(env.AI_TEMPERATURE) || 0.7
    });

    const response = aiResponse.response || aiResponse.text || 'Unable to analyze threat data.';
    
    return new Response(JSON.stringify({
      success: true,
      response: response,
      threatData: threatData,
      model: '@cf/meta/llama-3.1-8b-instruct',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Threat Analysis Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleThreatFeed(request, env, corsHeaders) {
  console.log('=== handleThreatFeed called ===');
  try {
    // Temporarily disable caching for debugging
    // const cacheKey = 'threat_feed_cache';
    // const cachedData = await getCachedThreatData(env, cacheKey);
    
    // if (cachedData && !isCacheExpired(cachedData.timestamp, 30)) {
    //   console.log('Returning cached threat data with', cachedData.threats?.length || 0, 'threats');
    //   return new Response(JSON.stringify(cachedData), {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       ...corsHeaders
    //     }
    //   });
    // }
    
    console.log('Cache disabled for debugging, fetching fresh data...');
    
    console.log('Fetching fresh threat data from external sources');
    // Fetch real-world threat intelligence from multiple sources
    const threatData = await fetchRealWorldThreats();
    
    // Calculate dashboard metrics from real data
    const activeThreats = threatData.filter(t => t.status === 'active').length;
    const todayThreats = threatData.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.timestamp).toDateString() === today;
    }).length;
    
    // Calculate average risk level
    const avgRisk = threatData.length > 0 ? 
      threatData.reduce((sum, t) => sum + (t.riskScore || 0), 0) / threatData.length : 0;
    
    const riskLevel = avgRisk > 0.8 ? 'Critical' : 
                     avgRisk > 0.6 ? 'High' : 
                     avgRisk > 0.4 ? 'Medium' : 'Low';
    
    const responseData = {
      success: true,
      threats: threatData,
      metrics: {
        activeThreats,
        todayThreats,
        riskLevel,
        avgRiskScore: avgRisk
      },
          sources: ['NVD (National Vulnerability Database)'],
      timestamp: new Date().toISOString(),
      cached: false
    };
    
        // Cache disabled for debugging
        // await cacheThreatData(env, cacheKey, responseData);
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Threat feed error:', error);
    // Fallback to mock data on error
    const mockThreats = await generateRealisticThreatData();
    return new Response(JSON.stringify({
      success: true,
      threats: mockThreats,
      metrics: {
        activeThreats: mockThreats.filter(t => t.status === 'active').length,
        todayThreats: mockThreats.filter(t => {
          const today = new Date().toDateString();
          return new Date(t.timestamp).toDateString() === today;
        }).length,
        riskLevel: 'Medium',
        avgRiskScore: 0.5
      },
          sources: ['No Data Available'],
      timestamp: new Date().toISOString(),
      cached: false
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Cache management functions
async function getCachedThreatData(env, cacheKey) {
  try {
    // Use ThreatDatabase as cache storage
    const threatDbId = env.THREAT_DATABASE.idFromName('cache');
    const threatDb = env.THREAT_DATABASE.get(threatDbId);
    
    const response = await threatDb.fetch(`http://localhost/cache-get?key=${cacheKey}`);
    const data = await response.json();
    
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

async function cacheThreatData(env, cacheKey, data) {
  try {
    const threatDbId = env.THREAT_DATABASE.idFromName('cache');
    const threatDb = env.THREAT_DATABASE.get(threatDbId);
    
    await threatDb.fetch('http://localhost/cache-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: cacheKey,
        data: data,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}

function isCacheExpired(timestamp, minutesTTL) {
  const now = Date.now();
  const cacheAge = now - new Date(timestamp).getTime();
  const ttlMs = minutesTTL * 60 * 1000;
  return cacheAge > ttlMs;
}

// Backend text sanitization function
function sanitizeBackendText(text) {
  if (!text) return '';
  
  // Replace common encoding issues that might come from external APIs
  return text
    .replace(/â€¢/g, '-')  // Replace bullet character encoding issues
    .replace(/â€/g, '"')   // Replace smart quote encoding issues
    .replace(/â€™/g, "'")   // Replace apostrophe encoding issues
    .replace(/â€œ/g, '"')   // Replace opening quote encoding issues
    .replace(/â€/g, '"')    // Replace closing quote encoding issues
    .replace(/â€"/g, '–')   // Replace en dash encoding issues
    .replace(/â€"/g, '—')   // Replace em dash encoding issues
    .replace(/â€¦/g, '...')  // Replace ellipsis encoding issues
    .replace(/[^\x00-\x7F]/g, '') // Remove any remaining non-ASCII characters
    .trim();
}

// Fetch real-world cybersecurity threats from multiple sources
async function fetchRealWorldThreats() {
  const threats = [];
  
  try {
    console.log('Starting to fetch real-world threats...');
    // Only fetch real CVEs from NVD (National Vulnerability Database)
    const cveThreats = await fetchRecentCVEs();
    console.log(`Fetched ${cveThreats.length} CVE threats`);
    threats.push(...cveThreats);
    
  } catch (error) {
    console.error('Error fetching real-world threats:', error);
  }
  
  console.log(`Total threats collected: ${threats.length}`);
  
  // Sort by timestamp (newest first) and limit to 10 threats
  const sortedThreats = threats
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10); // Only return the latest 10 threats
  
  console.log(`Returning ${sortedThreats.length} threats`);
  return sortedThreats;
}

// Fetch recent CVEs from NVD API
async function fetchRecentCVEs() {
  try {
    // Generate dynamic dates based on current date
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0); // Start of current day
    
    const endDate = new Date(currentDate);
    endDate.setHours(23, 59, 59, 999); // End of current day
    
    // Format dates for NVD API (ISO format with timezone offset)
    const startDateStr = startDate.toISOString().replace('Z', '-07:00');
    const endDateStr = endDate.toISOString().replace('Z', '-07:00');
    
    const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0/?pubStartDate=${startDateStr}&pubEndDate=${endDateStr}`;
    
    console.log('Fetching CVEs from NVD API:', nvdUrl);
    console.log('Date range:', startDateStr, 'to', endDateStr);
    
    const response = await fetch(nvdUrl, {
      headers: {
        'User-Agent': 'CyberThreat-AI/1.0 (Security Research)',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      }
    });
    
    console.log('NVD API response status:', response.status);
    
    if (!response.ok) {
      console.log('NVD API failed with status:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    const cves = data.vulnerabilities || [];
    
    console.log(`Successfully fetched ${cves.length} CVEs from NVD`);
    
    if (cves.length === 0) {
      console.log('No CVEs returned from NVD API');
      return [];
    }
    
    // Sort CVEs by publication date (newest first) - no date filtering needed since API already filters
    const sortedCves = cves
      .sort((a, b) => new Date(b.cve.published) - new Date(a.cve.published));
    
    // Show the first few CVE dates for debugging
    console.log('First 10 CVE publication dates (newest first):');
    sortedCves.slice(0, 10).forEach((cve, index) => {
      console.log(`${index + 1}. ${cve.cve.id}: ${cve.cve.published}`);
    });
    
    // Take only the 10 most recent CVEs
    const recentCves = sortedCves.slice(0, 10);
    
    console.log(`Taking ${recentCves.length} most recent CVEs`);
    
    const processedCves = recentCves.map(cve => {
      const cveData = cve.cve;
      const cvssScore = cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                       cveData.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore || 
                       cveData.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || 0;
      
      return {
        id: cveData.id,
        type: 'vulnerability',
        riskLevel: cvssScore >= 9 ? 'critical' : cvssScore >= 7 ? 'high' : cvssScore >= 4 ? 'medium' : 'low',
        status: 'active',
        timestamp: cveData.published,
        riskScore: cvssScore / 10, // Normalize to 0-1
        source: 'NVD',
        description: sanitizeBackendText(cveData.descriptions?.[0]?.value) || 'No description available',
        indicators: [cveData.id],
        tags: ['cve', 'vulnerability', `cvss-${cvssScore >= 7 ? 'high' : 'medium'}`],
        metadata: {
          cvssScore: cvssScore,
          severity: cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 
                   cveData.metrics?.cvssMetricV30?.[0]?.cvssData?.baseSeverity ||
                   cveData.metrics?.cvssMetricV2?.[0]?.baseSeverity || 'UNKNOWN',
          published: cveData.published,
          lastModified: cveData.lastModified
        }
      };
    });
    
    console.log(`Processed ${processedCves.length} CVEs for return`);
    return processedCves;
    
  } catch (error) {
    console.error('Error fetching CVEs:', error);
    return [];
  }
}

// Fetch threat intelligence from MISP (Malware Information Sharing Platform)
async function fetchMISPThreats() {
  try {
    // Using a public MISP instance or threat intelligence feed
    // For demo purposes, we'll simulate MISP data with current threat patterns
    const currentThreats = [
      {
        id: `misp_${Date.now()}_1`,
        type: 'malware',
        riskLevel: 'high',
        status: 'active',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.8,
        source: 'MISP',
        description: 'Recent malware campaign targeting financial institutions',
        indicators: ['malware_hash_123', 'suspicious_domain.com', 'phishing_email_pattern'],
        tags: ['malware', 'financial', 'campaign'],
        metadata: {
          threatActor: 'Unknown',
          campaign: 'Financial Theft'
        }
      },
      {
        id: `misp_${Date.now()}_2`,
        type: 'phishing',
        riskLevel: 'medium',
        status: 'active',
        timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.6,
        source: 'MISP',
        description: 'Phishing campaign using COVID-19 themed emails',
        indicators: ['phishing_url_456', 'fake_covid_site.com'],
        tags: ['phishing', 'covid19', 'social-engineering'],
        metadata: {
          target: 'Healthcare Organizations',
          technique: 'Social Engineering'
        }
      }
    ];
    
    return currentThreats;
    
  } catch (error) {
    console.error('Error fetching MISP threats:', error);
    return [];
  }
}

// Fetch security advisories
async function fetchSecurityAdvisories() {
  try {
    // Simulate security advisories from various sources
    const advisories = [
      {
        id: `advisory_${Date.now()}_1`,
        type: 'apt',
        riskLevel: 'critical',
        status: 'active',
        timestamp: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.9,
        source: 'Security Advisory',
        description: 'Advanced Persistent Threat targeting critical infrastructure',
        indicators: ['apt_ioc_789', 'command_control_server.com'],
        tags: ['apt', 'critical-infrastructure', 'nation-state'],
        metadata: {
          threatActor: 'APT Group',
          target: 'Critical Infrastructure'
        }
      },
      {
        id: `advisory_${Date.now()}_2`,
        type: 'ransomware',
        riskLevel: 'high',
        status: 'active',
        timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.85,
        source: 'Security Advisory',
        description: 'New ransomware variant targeting healthcare sector',
        indicators: ['ransomware_hash_101', 'payment_site.onion'],
        tags: ['ransomware', 'healthcare', 'encryption'],
        metadata: {
          variant: 'New Variant',
          target: 'Healthcare Sector'
        }
      }
    ];
    
    return advisories;
    
  } catch (error) {
    console.error('Error fetching security advisories:', error);
    return [];
  }
}

// Fetch current threat intelligence based on recent cybersecurity events
async function fetchCurrentThreatIntelligence() {
  try {
    // Simulate current threat intelligence based on recent cybersecurity trends
    const currentThreats = [
      {
        id: `current_${Date.now()}_1`,
        type: 'ddos',
        riskLevel: 'medium',
        status: 'active',
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.7,
        source: 'Threat Intelligence',
        description: 'DDoS attacks targeting cloud infrastructure providers',
        indicators: ['ddos_botnet_202', 'attack_vector_udp'],
        tags: ['ddos', 'cloud', 'infrastructure'],
        metadata: {
          attackType: 'UDP Flood',
          target: 'Cloud Infrastructure'
        }
      },
      {
        id: `current_${Date.now()}_2`,
        type: 'insider',
        riskLevel: 'high',
        status: 'investigating',
        timestamp: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.75,
        source: 'Threat Intelligence',
        description: 'Insider threat activity detected in technology sector',
        indicators: ['unusual_access_pattern', 'data_exfiltration_attempt'],
        tags: ['insider-threat', 'technology', 'data-theft'],
        metadata: {
          threatType: 'Insider Threat',
          sector: 'Technology'
        }
      }
    ];
    
    return currentThreats;
    
  } catch (error) {
    console.error('Error fetching current threat intelligence:', error);
    return [];
  }
}

// Generate realistic threat data for demonstration
async function generateRealisticThreatData() {
  const threatTypes = ['malware', 'phishing', 'ddos', 'botnet', 'ransomware', 'apt', 'insider'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const statuses = ['active', 'investigating', 'contained', 'resolved'];
  
  const threats = [];
  const now = Date.now();
  
  // Generate 10-20 realistic threats
  const threatCount = Math.floor(Math.random() * 11) + 10;
  
  for (let i = 0; i < threatCount; i++) {
    const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate timestamp within last 7 days
    const timestamp = now - Math.random() * 7 * 24 * 60 * 60 * 1000;
    
    const threat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      riskLevel: riskLevel,
      status: status,
      timestamp: new Date(timestamp).toISOString(),
      riskScore: getRiskScore(type, riskLevel),
      source: getRandomSource(),
      indicators: generateIndicators(type),
      description: getThreatDescription(type, riskLevel),
      tags: generateTags(type, riskLevel)
    };
    
    threats.push(threat);
  }
  
  return threats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getRiskScore(type, riskLevel) {
  const typeScores = {
    'malware': 0.8,
    'phishing': 0.7,
    'ddos': 0.6,
    'botnet': 0.9,
    'ransomware': 0.95,
    'apt': 0.85,
    'insider': 0.7
  };
  
  const levelMultipliers = {
    'low': 0.3,
    'medium': 0.6,
    'high': 0.8,
    'critical': 1.0
  };
  
  return (typeScores[type] || 0.5) * (levelMultipliers[riskLevel] || 0.5);
}

function getRandomSource() {
  const sources = ['VirusTotal', 'AbuseIPDB', 'Shodan', 'MISP', 'OpenCTI', 'Internal SIEM', 'EDR Alert'];
  return sources[Math.floor(Math.random() * sources.length)];
}

function generateIndicators(type) {
  const indicators = {
    'malware': ['suspicious_process.exe', 'registry_modification', 'network_connection'],
    'phishing': ['suspicious_url', 'email_attachment', 'social_engineering'],
    'ddos': ['traffic_spike', 'resource_exhaustion', 'botnet_activity'],
    'botnet': ['c2_communication', 'coordinated_attack', 'zombie_network'],
    'ransomware': ['file_encryption', 'ransom_note', 'payment_demand'],
    'apt': ['lateral_movement', 'persistence_mechanism', 'data_exfiltration'],
    'insider': ['unusual_access', 'data_exfiltration', 'privilege_abuse']
  };
  
  const typeIndicators = indicators[type] || ['unknown_indicator'];
  return typeIndicators.slice(0, Math.floor(Math.random() * 3) + 1);
}

function getThreatDescription(type, riskLevel) {
  const descriptions = {
    'malware': `Malicious software detected with ${riskLevel} risk level. Immediate investigation required.`,
    'phishing': `Phishing campaign targeting organization with ${riskLevel} severity. User awareness training recommended.`,
    'ddos': `Distributed denial of service attack detected with ${riskLevel} impact. Mitigation measures activated.`,
    'botnet': `Botnet activity identified with ${riskLevel} threat level. Network isolation recommended.`,
    'ransomware': `Ransomware attack in progress with ${riskLevel} severity. Incident response team activated.`,
    'apt': `Advanced persistent threat detected with ${riskLevel} sophistication. Long-term monitoring required.`,
    'insider': `Insider threat activity identified with ${riskLevel} risk. HR and security team notified.`
  };
  
  return descriptions[type] || `Unknown threat type with ${riskLevel} risk level.`;
}

function generateTags(type, riskLevel) {
  const tags = [type, `risk:${riskLevel}`];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    tags.push('urgent');
  }
  
  if (type === 'apt' || type === 'ransomware') {
    tags.push('sophisticated');
  }
  
  return tags;
}

// Handle threat data ingestion
async function handleThreatIngest(request, env, corsHeaders) {
  try {
    const threatData = await request.json();
    
    // Validate required fields
    if (!threatData.type || !threatData.indicators) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: type and indicators are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Get ThreatDatabase Durable Object
    const threatDbId = env.THREAT_DATABASE.idFromName('main');
    const threatDb = env.THREAT_DATABASE.get(threatDbId);
    
    // Store the threat in the database
    const response = await threatDb.fetch('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(threatData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        threatId: result.threatId,
        message: 'Threat successfully ingested and stored'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to store threat'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } catch (error) {
    console.error('Threat ingestion error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleWorkflowTrigger(request, env, corsHeaders) {
  try {
    const { workflowType, parameters } = await request.json();
    
    const response = `Workflow ${workflowType} triggered with parameters: ${JSON.stringify(parameters)}`;
    
    return new Response(JSON.stringify({
      success: true,
      response: response
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleWebSocket(request, env) {
  const { 0: client, 1: server } = new WebSocketPair();
  
  server.accept();
  
  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'subscribe':
          server.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel
          }));
          break;
        case 'ping':
          server.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          server.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type' 
          }));
      }
    } catch (error) {
      server.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });
  
  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
