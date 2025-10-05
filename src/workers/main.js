// Main Worker Entry Point
// Handles routing and coordinates between different components

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
        case '/api/threats/analyze':
          return handleThreatAnalysis(request, env, corsHeaders);
        
        case '/api/threats/feed':
          return handleThreatFeed(request, env, corsHeaders);
        
        case '/api/chat':
          return handleChat(request, env, corsHeaders);
        
        case '/api/voice':
          return handleVoice(request, env, corsHeaders);
        
        case '/api/workflows/trigger':
          return handleWorkflowTrigger(request, env, corsHeaders);
        
        case '/ws/threats':
          return handleWebSocket(request, env);
        
        case '/api/test':
          return handleTest(request, env, corsHeaders);
        
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
  },

  async websocket(websocket, env) {
    // Handle WebSocket connections for real-time updates
    websocket.accept();
    
    websocket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        await handleWebSocketMessage(websocket, data, env);
      } catch (error) {
        console.error('WebSocket error:', error);
        websocket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
  }
};

async function handleThreatAnalysis(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const threatData = await request.json();
    
    // Get Durable Object instance
    const threatDb = env.THREAT_DATABASE.get(
      env.THREAT_DATABASE.idFromName('main-db')
    );
    
    // Analyze threat using AI
    const analysis = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are an expert cybersecurity analyst AI. Analyze the following threat data and provide:
1. Threat Classification: Categorize the threat (malware, phishing, DDoS, etc.)
2. Risk Assessment: Rate the risk level (Low/Medium/High/Critical)
3. Threat Indicators: List key indicators of compromise (IOCs)
4. Impact Analysis: Assess potential business impact
5. Mitigation Recommendations: Provide specific actionable steps
6. Related Threats: Identify similar threats or attack patterns

Format your response as structured JSON with clear categories and actionable insights.`
        },
        {
          role: 'user',
          content: `Threat Data: ${JSON.stringify(threatData)}`
        }
      ],
      max_tokens: parseInt(env.AI_MAX_TOKENS) || 2048,
      temperature: parseFloat(env.AI_TEMPERATURE) || 0.7
    });

    // Store analysis in database
    await threatDb.storage.put(`analysis_${Date.now()}`, {
      threatData,
      analysis: analysis.response,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis: analysis.response,
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Threat analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to analyze threat'
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
  try {
    // Return sample threat data for now (we'll fix Durable Objects later)
    const sampleThreats = [
      {
        id: 'threat_1',
        type: 'malware',
        ip: '192.168.1.100',
        domain: 'suspicious-site.com',
        riskLevel: 'high',
        timestamp: Date.now() - 3600000,
        status: 'active'
      },
      {
        id: 'threat_2',
        type: 'phishing',
        ip: '192.168.1.101',
        domain: 'phishing-site.com',
        riskLevel: 'medium',
        timestamp: Date.now() - 7200000,
        status: 'active'
      },
      {
        id: 'threat_3',
        type: 'ddos',
        ip: '192.168.1.102',
        domain: 'attack-source.com',
        riskLevel: 'high',
        timestamp: Date.now() - 10800000,
        status: 'active'
      }
    ];
    
    return new Response(JSON.stringify({
      success: true,
      threats: sampleThreats,
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Threat feed error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch threat feed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleChat(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { message, sessionId } = await request.json();
    
    // Process chat message with AI (simplified version)
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are a cybersecurity AI assistant. Help users analyze threats and provide security insights. Be helpful and technical.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: parseInt(env.AI_MAX_TOKENS) || 2048,
      temperature: parseFloat(env.AI_TEMPERATURE) || 0.7
    });

    return new Response(JSON.stringify({
      success: true,
      response: response.response,
      sessionId: sessionId || 'default'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleVoice(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { audioData, sessionId } = await request.json();
    
    // Process voice command with AI
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are a voice-activated security AI. Process the following voice command and:
1. Command Recognition: Identify the security action requested
2. Parameter Extraction: Extract relevant parameters (IPs, domains, timeframes)
3. Action Mapping: Map to appropriate security functions
4. Confirmation: Provide clear confirmation of the action
5. Status Updates: Offer to provide status updates

Respond with clear, concise confirmations suitable for voice output.`
        },
        {
          role: 'user',
          content: `Voice Command: ${audioData}`
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    });

    return new Response(JSON.stringify({
      success: true,
      response: response.response,
      sessionId: sessionId || 'default'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process voice command'
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
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { workflowType, parameters } = await request.json();
    
    // Trigger appropriate workflow
    const workflowEngine = env.WORKFLOW_ENGINE.get(
      env.WORKFLOW_ENGINE.idFromName('main-engine')
    );
    
    const result = await workflowEngine.triggerWorkflow(workflowType, parameters);

    return new Response(JSON.stringify({
      success: true,
      workflowId: result.id,
      status: result.status
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Workflow trigger error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to trigger workflow'
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
  // WebSocket upgrade handling
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  // Handle WebSocket messages
  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);
      await handleWebSocketMessage(server, data, env);
    } catch (error) {
      console.error('WebSocket error:', error);
      server.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function handleTest(request, env, corsHeaders) {
  try {
    return new Response(JSON.stringify({
      success: true,
      message: 'Worker is running!',
      timestamp: Date.now(),
      environment: env.ENVIRONMENT,
      aiAvailable: !!env.AI
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Test failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleWebSocketMessage(websocket, data, env) {
  switch (data.type) {
    case 'subscribe':
      // Subscribe to threat updates
      websocket.send(JSON.stringify({
        type: 'subscribed',
        channel: data.channel
      }));
      break;
    
    case 'ping':
      websocket.send(JSON.stringify({ type: 'pong' }));
      break;
    
    default:
      websocket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Unknown message type' 
      }));
  }
}
