// Session Manager Durable Object
// Handles user sessions, authentication, and session state

export class SessionManager {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/create':
          return this.createSession(request);
        case '/get':
          return this.getSession(request);
        case '/update':
          return this.updateSession(request);
        case '/delete':
          return this.deleteSession(request);
        case '/list':
          return this.listSessions(request);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('SessionManager error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async createSession(request) {
    try {
      const sessionData = await request.json();
      const sessionId = this.generateSessionId();
      
      const session = {
        id: sessionId,
        userId: sessionData.userId || 'anonymous',
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        data: sessionData.data || {},
        metadata: {
          userAgent: request.headers.get('User-Agent'),
          ipAddress: request.headers.get('CF-Connecting-IP'),
          ...sessionData.metadata
        }
      };

      await this.state.storage.put(`session_${sessionId}`, session);

      return new Response(JSON.stringify({
        success: true,
        sessionId: sessionId,
        session: session
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Create session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getSession(request) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(`session_${sessionId}`);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update last accessed time
      session.lastAccessed = new Date().toISOString();
      await this.state.storage.put(`session_${sessionId}`, session);

      return new Response(JSON.stringify({
        success: true,
        session: session
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async updateSession(request) {
    try {
      const { sessionId, data } = await request.json();
      
      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await this.state.storage.get(`session_${sessionId}`);
      
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update session data
      session.data = { ...session.data, ...data };
      session.lastAccessed = new Date().toISOString();
      
      await this.state.storage.put(`session_${sessionId}`, session);

      return new Response(JSON.stringify({
        success: true,
        session: session
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Update session error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async deleteSession(request) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await this.state.storage.delete(`session_${sessionId}`);

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
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async listSessions(request) {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      const limit = parseInt(url.searchParams.get('limit')) || 50;

      const sessions = await this.getAllSessions();
      
      let filteredSessions = sessions;
      if (userId) {
        filteredSessions = sessions.filter(session => session.userId === userId);
      }

      // Sort by last accessed (newest first) and limit
      const sortedSessions = filteredSessions
        .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
        .slice(0, limit);

      return new Response(JSON.stringify({
        success: true,
        sessions: sortedSessions,
        total: filteredSessions.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('List sessions error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getAllSessions() {
    const sessions = [];
    const keys = await this.state.storage.list({ prefix: 'session_' });
    
    for (const [key, value] of keys) {
      sessions.push(value);
    }
    
    return sessions;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
