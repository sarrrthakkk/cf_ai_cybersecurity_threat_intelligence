// Session Manager Durable Object
// Manages user sessions and conversation history

export class SessionManager {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/create':
        return this.createSession(request);
      case '/get':
        return this.getSession(request);
      case '/add-message':
        return this.addMessage(request);
      case '/get-history':
        return this.getHistory(request);
      case '/update':
        return this.updateSession(request);
      case '/delete':
        return this.deleteSession(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  async createSession(request) {
    try {
      const { userId, sessionType = 'chat' } = await request.json();
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session = {
        id: sessionId,
        userId: userId || 'anonymous',
        type: sessionType,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        status: 'active',
        settings: {
          language: 'en',
          voiceEnabled: false,
          notifications: true,
          theme: 'dark'
        },
        context: {
          currentThreat: null,
          analysisMode: 'standard',
          preferences: {}
        },
        messages: [],
        metadata: {
          userAgent: request.headers.get('User-Agent'),
          ipAddress: request.headers.get('CF-Connecting-IP'),
          country: request.headers.get('CF-IPCountry')
        }
      };

      await this.state.storage.put(sessionId, session);

      return new Response(JSON.stringify({
        success: true,
        sessionId,
        session
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Create session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create session'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getSession(request) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('id');

      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(sessionId);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update last activity
      session.lastActivity = Date.now();
      await this.state.storage.put(sessionId, session);

      return new Response(JSON.stringify({
        success: true,
        session
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve session'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async addMessage(request) {
    try {
      const { sessionId, message, response, messageType = 'text' } = await request.json();

      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(sessionId);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const messageData = {
        id: messageId,
        timestamp: Date.now(),
        type: messageType,
        content: message,
        response: response || null,
        metadata: {
          length: message.length,
          language: await this.detectLanguage(message)
        }
      };

      // Add message to session
      session.messages.push(messageData);
      session.lastActivity = Date.now();

      // Keep only last 100 messages to prevent storage bloat
      if (session.messages.length > 100) {
        session.messages = session.messages.slice(-100);
      }

      await this.state.storage.put(sessionId, session);

      return new Response(JSON.stringify({
        success: true,
        messageId,
        message: messageData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Add message error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to add message'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getHistory(request) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('id');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(sessionId);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get recent messages
      const recentMessages = session.messages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      return new Response(JSON.stringify({
        success: true,
        messages: recentMessages,
        total: session.messages.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get history error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve history'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async updateSession(request) {
    try {
      const { sessionId, updates } = await request.json();

      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(sessionId);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update session with provided updates
      Object.assign(session, updates);
      session.lastActivity = Date.now();

      await this.state.storage.put(sessionId, session);

      return new Response(JSON.stringify({
        success: true,
        session
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Update session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update session'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async deleteSession(request) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('id');

      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(sessionId);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await this.state.storage.delete(sessionId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Session deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Delete session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete session'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async detectLanguage(text) {
    // Simple language detection based on common patterns
    const patterns = {
      'en': /[a-zA-Z]/,
      'es': /[ñáéíóúü]/,
      'fr': /[àâäéèêëïîôöùûüÿç]/,
      'de': /[äöüß]/,
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ar': /[\u0600-\u06ff]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  // Cleanup old sessions (called periodically)
  async cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    const sessions = await this.state.storage.list();
    
    for (const [key, session] of sessions) {
      if (key.startsWith('session_') && 
          (now - session.lastActivity) > maxAge) {
        await this.state.storage.delete(key);
      }
    }
  }
}
