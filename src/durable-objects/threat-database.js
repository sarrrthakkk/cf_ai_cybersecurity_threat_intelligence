// Threat Database Durable Object
// Manages persistent storage of threat intelligence data

export class ThreatDatabase {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/store':
        return this.storeThreat(request);
      case '/get':
        return this.getThreat(request);
      case '/search':
        return this.searchThreats(request);
      case '/recent':
        return this.getRecentThreats(request);
      case '/correlate':
        return this.correlateThreats(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  async storeThreat(request) {
    try {
      const threatData = await request.json();
      
      // Generate unique threat ID
      const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Enhanced threat data with metadata
      const enhancedThreat = {
        id: threatId,
        ...threatData,
        timestamp: Date.now(),
        status: 'active',
        riskScore: await this.calculateRiskScore(threatData),
        tags: await this.generateTags(threatData),
        metadata: {
          source: threatData.source || 'unknown',
          confidence: threatData.confidence || 0.5,
          lastSeen: Date.now()
        }
      };

      // Store in Durable Object storage
      await this.state.storage.put(threatId, enhancedThreat);
      
      // Update indexes
      await this.updateIndexes(enhancedThreat);

      return new Response(JSON.stringify({
        success: true,
        threatId,
        message: 'Threat stored successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Store threat error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to store threat'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getThreat(request) {
    try {
      const url = new URL(request.url);
      const threatId = url.searchParams.get('id');

      if (!threatId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Threat ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const threat = await this.state.storage.get(threatId);
      
      if (!threat) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Threat not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        threat
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get threat error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve threat'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async searchThreats(request) {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const type = url.searchParams.get('type');
      const riskLevel = url.searchParams.get('risk');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      // Get all threats and filter
      const allThreats = await this.getAllThreats();
      
      let filteredThreats = allThreats;

      // Apply filters
      if (query) {
        filteredThreats = filteredThreats.filter(threat => 
          JSON.stringify(threat).toLowerCase().includes(query.toLowerCase())
        );
      }

      if (type) {
        filteredThreats = filteredThreats.filter(threat => 
          threat.type === type
        );
      }

      if (riskLevel) {
        filteredThreats = filteredThreats.filter(threat => 
          threat.riskLevel === riskLevel
        );
      }

      // Sort by timestamp (newest first)
      filteredThreats.sort((a, b) => b.timestamp - a.timestamp);

      // Limit results
      filteredThreats = filteredThreats.slice(0, limit);

      return new Response(JSON.stringify({
        success: true,
        threats: filteredThreats,
        total: filteredThreats.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Search threats error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to search threats'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getRecentThreats(limit = 50) {
    try {
      const allThreats = await this.getAllThreats();
      
      // Sort by timestamp and limit
      const recentThreats = allThreats
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      return recentThreats;

    } catch (error) {
      console.error('Get recent threats error:', error);
      return [];
    }
  }

  async correlateThreats(request) {
    try {
      const { threatId, correlationType = 'similar' } = await request.json();
      
      const targetThreat = await this.state.storage.get(threatId);
      if (!targetThreat) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Threat not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const allThreats = await this.getAllThreats();
      const correlatedThreats = [];

      // Find correlated threats based on different criteria
      for (const threat of allThreats) {
        if (threat.id === threatId) continue;

        let correlationScore = 0;

        // IP address correlation
        if (targetThreat.ip && threat.ip && targetThreat.ip === threat.ip) {
          correlationScore += 0.8;
        }

        // Domain correlation
        if (targetThreat.domain && threat.domain && targetThreat.domain === threat.domain) {
          correlationScore += 0.7;
        }

        // Hash correlation
        if (targetThreat.hash && threat.hash && targetThreat.hash === threat.hash) {
          correlationScore += 0.9;
        }

        // Type correlation
        if (targetThreat.type && threat.type && targetThreat.type === threat.type) {
          correlationScore += 0.3;
        }

        // Time correlation (within 24 hours)
        const timeDiff = Math.abs(targetThreat.timestamp - threat.timestamp);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          correlationScore += 0.2;
        }

        if (correlationScore > 0.3) {
          correlatedThreats.push({
            ...threat,
            correlationScore
          });
        }
      }

      // Sort by correlation score
      correlatedThreats.sort((a, b) => b.correlationScore - a.correlationScore);

      return new Response(JSON.stringify({
        success: true,
        correlatedThreats,
        total: correlatedThreats.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Correlate threats error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to correlate threats'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getAllThreats() {
    const threats = [];
    const keys = await this.state.storage.list();
    
    for (const [key, value] of keys) {
      if (key.startsWith('threat_')) {
        threats.push(value);
      }
    }
    
    // If no threats exist, return some sample data for testing
    if (threats.length === 0) {
      return [
        {
          id: 'sample_threat_1',
          type: 'malware',
          ip: '192.168.1.100',
          domain: 'suspicious-site.com',
          riskLevel: 'high',
          timestamp: Date.now() - 3600000,
          status: 'active'
        },
        {
          id: 'sample_threat_2',
          type: 'phishing',
          ip: '192.168.1.101',
          domain: 'phishing-site.com',
          riskLevel: 'medium',
          timestamp: Date.now() - 7200000,
          status: 'active'
        }
      ];
    }
    
    return threats;
  }

  async calculateRiskScore(threatData) {
    let score = 0;

    // Base score from threat type
    const typeScores = {
      'malware': 0.8,
      'phishing': 0.7,
      'ddos': 0.6,
      'botnet': 0.9,
      'ransomware': 0.95,
      'apt': 0.85,
      'insider': 0.7,
      'unknown': 0.3
    };

    score += typeScores[threatData.type] || 0.5;

    // Adjust based on indicators
    if (threatData.indicators) {
      score += threatData.indicators.length * 0.1;
    }

    // Adjust based on confidence
    if (threatData.confidence) {
      score *= threatData.confidence;
    }

    // Cap at 1.0
    return Math.min(score, 1.0);
  }

  async generateTags(threatData) {
    const tags = [];

    // Add type tag
    if (threatData.type) {
      tags.push(threatData.type);
    }

    // Add source tag
    if (threatData.source) {
      tags.push(`source:${threatData.source}`);
    }

    // Add risk level tag
    const riskScore = await this.calculateRiskScore(threatData);
    if (riskScore > 0.8) {
      tags.push('high-risk');
    } else if (riskScore > 0.5) {
      tags.push('medium-risk');
    } else {
      tags.push('low-risk');
    }

    // Add time-based tags
    const now = Date.now();
    const threatTime = threatData.timestamp || now;
    const ageHours = (now - threatTime) / (1000 * 60 * 60);

    if (ageHours < 1) {
      tags.push('recent');
    } else if (ageHours < 24) {
      tags.push('today');
    } else if (ageHours < 168) {
      tags.push('this-week');
    }

    return tags;
  }

  async updateIndexes(threat) {
    // Update type index
    const typeIndex = await this.state.storage.get('index:type') || {};
    if (!typeIndex[threat.type]) {
      typeIndex[threat.type] = [];
    }
    typeIndex[threat.type].push(threat.id);
    await this.state.storage.put('index:type', typeIndex);

    // Update risk index
    const riskIndex = await this.state.storage.get('index:risk') || {};
    const riskLevel = threat.riskScore > 0.8 ? 'high' : 
                     threat.riskScore > 0.5 ? 'medium' : 'low';
    if (!riskIndex[riskLevel]) {
      riskIndex[riskLevel] = [];
    }
    riskIndex[riskLevel].push(threat.id);
    await this.state.storage.put('index:risk', riskIndex);

    // Update timestamp index
    const timeIndex = await this.state.storage.get('index:time') || [];
    timeIndex.push({
      id: threat.id,
      timestamp: threat.timestamp
    });
    timeIndex.sort((a, b) => b.timestamp - a.timestamp);
    await this.state.storage.put('index:time', timeIndex.slice(0, 1000)); // Keep last 1000
  }
}
