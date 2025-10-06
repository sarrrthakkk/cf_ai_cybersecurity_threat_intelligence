// Main Application JavaScript
// Handles initialization, API communication, and core functionality

class CyberThreatAI {
  constructor() {
    this.apiBase = '/api';
    this.sessionId = this.generateSessionId();
    this.isConnected = false;
    this.websocket = null;
    this.currentAnalysis = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeWebSocket();
    this.loadSettings();
    this.updateThreatStats();
    this.loadRecentThreats();
    
    setInterval(() => {
      this.updateThreatStats();
      this.loadRecentThreats();
    }, 30000);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessage');
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    sendBtn.addEventListener('click', () => this.sendMessage());

    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    const voiceToggle = document.getElementById('voiceToggle');
    const stopVoice = document.getElementById('stopVoice');
    
    voiceToggle.addEventListener('click', () => this.toggleVoiceInput());
    stopVoice.addEventListener('click', () => this.stopVoiceInput());

    const settingsToggle = document.getElementById('settingsToggle');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettings = document.getElementById('saveSettings');
    
    settingsToggle.addEventListener('click', () => this.openSettings());
    closeSettings.addEventListener('click', () => this.closeSettings());
    saveSettings.addEventListener('click', () => this.saveSettings());

    const closeAnalysis = document.getElementById('closeAnalysis');
    closeAnalysis.addEventListener('click', () => this.closeAnalysisPanel());

    const clearChat = document.getElementById('clearChat');
    clearChat.addEventListener('click', () => this.clearChat());

    const exportChat = document.getElementById('exportChat');
    exportChat.addEventListener('click', () => this.exportChat());
  }

  async sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;

    this.addMessageToChat(message, 'user');
    chatInput.value = '';

    this.showLoading('Analyzing your request...');

    try {
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.addMessageToChat(data.response, 'ai');
        
        if (this.containsThreatData(data.response)) {
          this.showAnalysisPanel(data.response);
        }
      } else {
        this.showToast('Failed to process message', 'error');
      }
    } catch (error) {
      console.error('Send message error:', error);
      this.showToast('Connection error. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i>
      </div>
      <div class="message-content">
        <div class="message-text">${this.formatMessage(message)}</div>
        <div class="message-time">${timeString}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  formatMessage(message) {
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  containsThreatData(message) {
    const threatKeywords = ['threat', 'malware', 'phishing', 'attack', 'vulnerability', 'risk', 'security'];
    return threatKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  async handleQuickAction(action) {
    const actions = {
      'analyze-ip': () => this.promptForInput('Enter IP address to analyze:', 'ip'),
      'scan-domain': () => this.promptForInput('Enter domain to scan:', 'domain'),
      'check-hash': () => this.promptForInput('Enter file hash to check:', 'hash'),
      'generate-report': () => this.generateSecurityReport()
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  promptForInput(message, type) {
    const input = window.prompt(message);
    if (input) {
      const composedMessage = `Please analyze this ${type}: ${input}`;
      document.getElementById('chatInput').value = composedMessage;
      this.sendMessage();
    }
  }

  async generateSecurityReport() {
    this.showLoading('Generating security report...');
    
    try {
      const response = await fetch(`${this.apiBase}/workflows/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowType: 'incident-response',
          parameters: {
            reportType: 'security-summary',
            timeframe: '24h',
            userId: this.sessionId
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.addMessageToChat(
          'Security report generation started. I\'ll notify you when it\'s ready.',
          'ai'
        );
      } else {
        this.showToast('Failed to generate report', 'error');
      }
    } catch (error) {
      console.error('Generate report error:', error);
      this.showToast('Failed to generate report', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async updateThreatStats() {
    try {
      const response = await fetch(`${this.apiBase}/threats/feed`);
      const data = await response.json();
      
      if (data.success) {
        const threats = data.threats || [];
        const activeThreats = threats.filter(t => t.status === 'active').length;
        const todayThreats = threats.filter(t => {
          const today = new Date().toDateString();
          return new Date(t.timestamp).toDateString() === today;
        }).length;
        
        const avgRisk = threats.reduce((sum, t) => sum + (t.riskScore || 0), 0) / threats.length;
        const riskLevel = avgRisk > 0.7 ? 'High' : avgRisk > 0.4 ? 'Medium' : 'Low';
        
        document.getElementById('activeThreats').textContent = activeThreats;
        document.getElementById('threatsToday').textContent = todayThreats;
        document.getElementById('riskLevel').textContent = riskLevel;
        
        const riskElement = document.getElementById('riskLevel');
        riskElement.className = `stat-number ${riskLevel.toLowerCase()}-risk`;
      }
    } catch (error) {
      console.error('Update threat stats error:', error);
    }
  }

  async loadRecentThreats() {
    try {
      const response = await fetch(`${this.apiBase}/threats/feed?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        const recentThreats = document.getElementById('recentThreats');
        recentThreats.innerHTML = '';
        
        data.threats.forEach(threat => {
          const threatDiv = document.createElement('div');
          threatDiv.className = `threat-item ${threat.riskLevel || 'low'}-risk`;
          threatDiv.innerHTML = `
            <div class="threat-title">${threat.type || 'Unknown Threat'}</div>
            <div class="threat-meta">
              ${new Date(threat.timestamp).toLocaleString()} • 
              Risk: ${threat.riskLevel || 'Low'}
            </div>
          `;
          
          threatDiv.addEventListener('click', () => {
            this.showThreatDetails(threat);
          });
          
          recentThreats.appendChild(threatDiv);
        });
      }
    } catch (error) {
      console.error('Load recent threats error:', error);
    }
  }

  showThreatDetails(threat) {
    const analysisContent = document.getElementById('analysisContent');
    analysisContent.innerHTML = `
      <div class="threat-details">
        <h4>Threat Details</h4>
        <div class="detail-item">
          <label>Type:</label>
          <span>${threat.type || 'Unknown'}</span>
        </div>
        <div class="detail-item">
          <label>Risk Level:</label>
          <span class="risk-${threat.riskLevel || 'low'}">${threat.riskLevel || 'Low'}</span>
        </div>
        <div class="detail-item">
          <label>Detected:</label>
          <span>${new Date(threat.timestamp).toLocaleString()}</span>
        </div>
        ${threat.description ? `
          <div class="detail-item">
            <label>Description:</label>
            <p>${threat.description}</p>
          </div>
        ` : ''}
        ${threat.indicators ? `
          <div class="detail-item">
            <label>Indicators:</label>
            <ul>
              ${threat.indicators.map(indicator => `<li>${indicator}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    this.showAnalysisPanel();
  }

  showAnalysisPanel(content = null) {
    const panel = document.getElementById('analysisPanel');
    panel.classList.add('open');
    
    if (content) {
      const analysisContent = document.getElementById('analysisContent');
      analysisContent.innerHTML = `
        <div class="analysis-result">
          <h4>AI Analysis</h4>
          <div class="analysis-text">${this.formatMessage(content)}</div>
        </div>
      `;
    }
  }

  closeAnalysisPanel() {
    const panel = document.getElementById('analysisPanel');
    panel.classList.remove('open');
  }

  initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/threats`;
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      this.isConnected = true;
      this.updateConnectionStatus(true);
      this.websocket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'threat-updates'
      }));
    };
    
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };
    
    this.websocket.onclose = () => {
      this.isConnected = false;
      this.updateConnectionStatus(false);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, 5000);
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionStatus(false);
    };
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'threat-update':
        this.handleThreatUpdate(data.threat);
        break;
      case 'analysis-complete':
        this.handleAnalysisComplete(data.analysis);
        break;
      case 'notification':
        this.showToast(data.message, data.level || 'info');
        break;
    }
  }

  handleThreatUpdate(threat) {
    this.showToast(`New threat detected: ${threat.type}`, 'warning');
    this.updateThreatStats();
    this.loadRecentThreats();
  }

  handleAnalysisComplete(analysis) {
    this.addMessageToChat(analysis, 'ai');
    this.showToast('Analysis complete', 'success');
  }

  updateConnectionStatus(connected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Connected';
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Disconnected';
    }
  }

  toggleVoiceInput() {
    const voiceToggle = document.getElementById('voiceToggle');
    const voiceInput = document.getElementById('voiceInput');
    
    if (voiceInput.style.display === 'none') {
      this.startVoiceInput();
    } else {
      this.stopVoiceInput();
    }
  }

  startVoiceInput() {
    const voiceToggle = document.getElementById('voiceToggle');
    const voiceInput = document.getElementById('voiceInput');
    
    voiceToggle.classList.add('active');
    voiceInput.style.display = 'block';
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chatInput').value = transcript;
        this.stopVoiceInput();
        this.sendMessage();
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.stopVoiceInput();
      };
      
      recognition.start();
    } else {
      this.showToast('Speech recognition not supported', 'error');
      this.stopVoiceInput();
    }
  }

  stopVoiceInput() {
    const voiceToggle = document.getElementById('voiceToggle');
    const voiceInput = document.getElementById('voiceInput');
    
    voiceToggle.classList.remove('active');
    voiceInput.style.display = 'none';
  }

  openSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('open');
  }

  closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('open');
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('cyberthreat-settings') || '{}');
    
    document.getElementById('aiModel').value = settings.aiModel || 'llama-3.3-70b-instruct';
    document.getElementById('responseLength').value = settings.responseLength || 'medium';
    document.getElementById('voiceEnabled').checked = settings.voiceEnabled !== false;
    document.getElementById('notifications').checked = settings.notifications !== false;
    document.getElementById('theme').value = settings.theme || 'dark';
  }

  saveSettings() {
    const settings = {
      aiModel: document.getElementById('aiModel').value,
      responseLength: document.getElementById('responseLength').value,
      voiceEnabled: document.getElementById('voiceEnabled').checked,
      notifications: document.getElementById('notifications').checked,
      theme: document.getElementById('theme').value
    };
    
    localStorage.setItem('cyberthreat-settings', JSON.stringify(settings));
    this.showToast('Settings saved', 'success');
    this.closeSettings();
  }

  clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.innerHTML = `
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
      `;
    }
  }

  exportChat() {
    const chatMessages = document.getElementById('chatMessages');
    const messages = Array.from(chatMessages.querySelectorAll('.message')).map(msg => {
      const text = msg.querySelector('.message-text').textContent;
      const time = msg.querySelector('.message-time').textContent;
      const sender = msg.classList.contains('ai-message') ? 'AI' : 'User';
      return `[${time}] ${sender}: ${text}`;
    }).join('\n\n');
    
    const blob = new Blob([messages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberthreat-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const spinner = overlay.querySelector('p');
    spinner.textContent = message;
    overlay.classList.add('show');
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('show');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
        <button class="toast-close">&times;</button>
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cyberThreatAI = new CyberThreatAI();
});
