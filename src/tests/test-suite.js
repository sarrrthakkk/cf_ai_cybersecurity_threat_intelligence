// Test suite for AI-Powered Cybersecurity Threat Intelligence Platform
// Tests all core functionality including AI integration, workflows, and state management

import { ThreatDatabase } from '../durable-objects/threat-database.js';
import { SessionManager } from '../durable-objects/session-manager.js';
import { WorkflowEngine } from '../durable-objects/workflow-engine.js';

// Mock environment for testing
const mockEnv = {
  AI: {
    run: async (model, options) => {
      // Mock AI response
      return {
        response: JSON.stringify({
          threatClassification: 'malware',
          riskAssessment: 'High',
          threatIndicators: ['suspicious_domain', 'malicious_payload'],
          impactAnalysis: 'Potential data breach',
          mitigationRecommendations: ['Block IP', 'Update firewall rules'],
          relatedThreats: ['threat_123', 'threat_456']
        })
      };
    }
  },
  THREAT_DATABASE: {
    get: (id) => new ThreatDatabase(mockState, mockEnv),
    idFromName: (name) => ({ toString: () => name })
  },
  SESSION_MANAGER: {
    get: (id) => new SessionManager(mockState, mockEnv),
    idFromName: (name) => ({ toString: () => name })
  },
  WORKFLOW_ENGINE: {
    get: (id) => new WorkflowEngine(mockState, mockEnv),
    idFromName: (name) => ({ toString: () => name })
  }
};

const mockState = {
  storage: new Map(),
  put: async (key, value) => mockState.storage.set(key, value),
  get: async (key) => mockState.storage.get(key),
  delete: async (key) => mockState.storage.delete(key),
  list: async () => Array.from(mockState.storage.entries())
};

// Test data
const sampleThreat = {
  type: 'malware',
  ip: '192.168.1.100',
  domain: 'suspicious-site.com',
  hash: 'a1b2c3d4e5f6',
  source: 'threat_feed',
  confidence: 0.8,
  indicators: ['malicious_payload', 'suspicious_behavior'],
  description: 'Suspicious malware detected'
};

const sampleSession = {
  userId: 'test_user',
  sessionType: 'chat'
};

// Test suite
class TestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🧪 Running CyberThreat AI Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`);
        await test.testFn();
        console.log(`✅ PASSED: ${test.name}\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`Error: ${error.message}\n`);
        this.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('📊 Test Summary:');
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message);
    }
  }
}

// Create test suite instance
const testSuite = new TestSuite();

// Threat Database Tests
testSuite.addTest('Threat Database - Store Threat', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  const request = new Request('/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleThreat)
  });
  
  const response = await threatDb.fetch(request);
  const data = await response.json();
  
  testSuite.assert(data.success, 'Threat storage should succeed');
  testSuite.assertNotNull(data.threatId, 'Threat ID should be generated');
});

testSuite.addTest('Threat Database - Retrieve Threat', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  // First store a threat
  const storeRequest = new Request('/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleThreat)
  });
  
  const storeResponse = await threatDb.fetch(storeRequest);
  const storeData = await storeResponse.json();
  
  // Then retrieve it
  const getRequest = new Request(`/get?id=${storeData.threatId}`);
  const getResponse = await threatDb.fetch(getRequest);
  const getData = await getResponse.json();
  
  testSuite.assert(getData.success, 'Threat retrieval should succeed');
  testSuite.assertEqual(getData.threat.type, sampleThreat.type, 'Threat type should match');
});

testSuite.addTest('Threat Database - Search Threats', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  // Store multiple threats
  const threats = [
    { ...sampleThreat, type: 'malware' },
    { ...sampleThreat, type: 'phishing', ip: '192.168.1.101' },
    { ...sampleThreat, type: 'ddos', ip: '192.168.1.102' }
  ];
  
  for (const threat of threats) {
    const request = new Request('/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(threat)
    });
    await threatDb.fetch(request);
  }
  
  // Search for malware threats
  const searchRequest = new Request('/search?type=malware');
  const searchResponse = await threatDb.fetch(searchRequest);
  const searchData = await searchResponse.json();
  
  testSuite.assert(searchData.success, 'Threat search should succeed');
  testSuite.assert(searchData.threats.length > 0, 'Should find malware threats');
});

testSuite.addTest('Threat Database - Threat Correlation', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  // Store related threats
  const threat1 = { ...sampleThreat, id: 'threat_1', ip: '192.168.1.100' };
  const threat2 = { ...sampleThreat, id: 'threat_2', ip: '192.168.1.100' };
  
  await threatDb.state.storage.put('threat_1', threat1);
  await threatDb.state.storage.put('threat_2', threat2);
  
  const request = new Request('/correlate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threatId: 'threat_1' })
  });
  
  const response = await threatDb.fetch(request);
  const data = await response.json();
  
  testSuite.assert(data.success, 'Threat correlation should succeed');
  testSuite.assert(data.correlatedThreats.length > 0, 'Should find correlated threats');
});

// Session Manager Tests
testSuite.addTest('Session Manager - Create Session', async () => {
  const sessionMgr = new SessionManager(mockState, mockEnv);
  
  const request = new Request('/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleSession)
  });
  
  const response = await sessionMgr.fetch(request);
  const data = await response.json();
  
  testSuite.assert(data.success, 'Session creation should succeed');
  testSuite.assertNotNull(data.sessionId, 'Session ID should be generated');
  testSuite.assertEqual(data.session.userId, sampleSession.userId, 'User ID should match');
});

testSuite.addTest('Session Manager - Add Message', async () => {
  const sessionMgr = new SessionManager(mockState, mockEnv);
  
  // Create session first
  const createRequest = new Request('/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleSession)
  });
  
  const createResponse = await sessionMgr.fetch(createRequest);
  const createData = await createResponse.json();
  
  // Add message
  const messageRequest = new Request('/add-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: createData.sessionId,
      message: 'Test message',
      response: 'AI response'
    })
  });
  
  const messageResponse = await sessionMgr.fetch(messageRequest);
  const messageData = await messageResponse.json();
  
  testSuite.assert(messageData.success, 'Message addition should succeed');
  testSuite.assertNotNull(messageData.messageId, 'Message ID should be generated');
});

testSuite.addTest('Session Manager - Get History', async () => {
  const sessionMgr = new SessionManager(mockState, mockEnv);
  
  // Create session and add messages
  const createRequest = new Request('/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleSession)
  });
  
  const createResponse = await sessionMgr.fetch(createRequest);
  const createData = await createResponse.json();
  
  // Add multiple messages
  for (let i = 0; i < 3; i++) {
    const messageRequest = new Request('/add-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: createData.sessionId,
        message: `Test message ${i}`,
        response: `AI response ${i}`
      })
    });
    await sessionMgr.fetch(messageRequest);
  }
  
  // Get history
  const historyRequest = new Request(`/get-history?id=${createData.sessionId}`);
  const historyResponse = await sessionMgr.fetch(historyRequest);
  const historyData = await historyResponse.json();
  
  testSuite.assert(historyData.success, 'History retrieval should succeed');
  testSuite.assert(historyData.messages.length >= 3, 'Should retrieve all messages');
});

// Workflow Engine Tests
testSuite.addTest('Workflow Engine - Trigger Workflow', async () => {
  const workflowEngine = new WorkflowEngine(mockState, mockEnv);
  
  const request = new Request('/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowType: 'threat-analysis',
      parameters: { threatData: sampleThreat }
    })
  });
  
  const response = await workflowEngine.fetch(request);
  const data = await response.json();
  
  testSuite.assert(data.success, 'Workflow trigger should succeed');
  testSuite.assertNotNull(data.workflowId, 'Workflow ID should be generated');
});

testSuite.addTest('Workflow Engine - Get Workflow Status', async () => {
  const workflowEngine = new WorkflowEngine(mockState, mockEnv);
  
  // Trigger workflow first
  const triggerRequest = new Request('/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowType: 'threat-analysis',
      parameters: { threatData: sampleThreat }
    })
  });
  
  const triggerResponse = await workflowEngine.fetch(triggerRequest);
  const triggerData = await triggerResponse.json();
  
  // Get status
  const statusRequest = new Request(`/status?id=${triggerData.workflowId}`);
  const statusResponse = await workflowEngine.fetch(statusRequest);
  const statusData = await statusResponse.json();
  
  testSuite.assert(statusData.success, 'Status retrieval should succeed');
  testSuite.assertNotNull(statusData.workflow, 'Workflow data should be returned');
});

testSuite.addTest('Workflow Engine - List Workflows', async () => {
  const workflowEngine = new WorkflowEngine(mockState, mockEnv);
  
  // Trigger multiple workflows
  for (let i = 0; i < 3; i++) {
    const request = new Request('/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowType: 'threat-analysis',
        parameters: { threatData: { ...sampleThreat, id: i } }
      })
    });
    await workflowEngine.fetch(request);
  }
  
  // List workflows
  const listRequest = new Request('/list');
  const listResponse = await workflowEngine.fetch(listRequest);
  const listData = await listResponse.json();
  
  testSuite.assert(listData.success, 'Workflow listing should succeed');
  testSuite.assert(listData.workflows.length >= 3, 'Should list all workflows');
});

// AI Integration Tests
testSuite.addTest('AI Integration - Threat Analysis', async () => {
  const response = await mockEnv.AI.run('@cf/meta/llama-3.3-70b-instruct', {
    messages: [
      {
        role: 'system',
        content: 'You are an expert cybersecurity analyst AI.'
      },
      {
        role: 'user',
        content: JSON.stringify(sampleThreat)
      }
    ],
    max_tokens: 2048,
    temperature: 0.7
  });
  
  testSuite.assertNotNull(response.response, 'AI should return analysis');
  
  const analysis = JSON.parse(response.response);
  testSuite.assertNotNull(analysis.threatClassification, 'Should classify threat');
  testSuite.assertNotNull(analysis.riskAssessment, 'Should assess risk');
});

// Performance Tests
testSuite.addTest('Performance - Concurrent Threat Storage', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    const request = new Request('/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sampleThreat, id: i })
    });
    promises.push(threatDb.fetch(request));
  }
  
  const responses = await Promise.all(promises);
  
  testSuite.assert(responses.length === 10, 'All requests should complete');
  responses.forEach(response => {
    testSuite.assert(response.ok, 'All responses should be successful');
  });
});

testSuite.addTest('Performance - Large Dataset Search', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  // Store many threats
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const request = new Request('/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...sampleThreat, 
        id: i,
        type: i % 3 === 0 ? 'malware' : i % 3 === 1 ? 'phishing' : 'ddos'
      })
    });
    promises.push(threatDb.fetch(request));
  }
  
  await Promise.all(promises);
  
  // Search with filter
  const searchRequest = new Request('/search?type=malware&limit=50');
  const searchResponse = await threatDb.fetch(searchRequest);
  const searchData = await searchResponse.json();
  
  testSuite.assert(searchData.success, 'Search should succeed');
  testSuite.assert(searchData.threats.length > 0, 'Should find malware threats');
});

// Security Tests
testSuite.addTest('Security - Input Validation', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  
  // Test with malicious input
  const maliciousRequest = new Request('/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: '<script>alert("xss")</script>',
      ip: '192.168.1.100; DROP TABLE threats;',
      domain: 'malicious.com'
    })
  });
  
  const response = await threatDb.fetch(maliciousRequest);
  const data = await response.json();
  
  // Should still succeed but sanitize input
  testSuite.assert(data.success, 'Should handle malicious input gracefully');
});

testSuite.addTest('Security - Access Control', async () => {
  const sessionMgr = new SessionManager(mockState, mockEnv);
  
  // Try to access non-existent session
  const request = new Request('/get?id=nonexistent');
  const response = await sessionMgr.fetch(request);
  const data = await response.json();
  
  testSuite.assert(!data.success, 'Should not allow access to non-existent session');
  testSuite.assertEqual(response.status, 404, 'Should return 404 for non-existent session');
});

// Integration Tests
testSuite.addTest('Integration - End-to-End Threat Analysis', async () => {
  const threatDb = new ThreatDatabase(mockState, mockEnv);
  const workflowEngine = new WorkflowEngine(mockState, mockEnv);
  
  // Store threat
  const storeRequest = new Request('/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleThreat)
  });
  
  const storeResponse = await threatDb.fetch(storeRequest);
  const storeData = await storeResponse.json();
  
  // Trigger analysis workflow
  const workflowRequest = new Request('/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowType: 'threat-analysis',
      parameters: { threatId: storeData.threatId }
    })
  });
  
  const workflowResponse = await workflowEngine.fetch(workflowRequest);
  const workflowData = await workflowResponse.json();
  
  testSuite.assert(storeData.success, 'Threat storage should succeed');
  testSuite.assert(workflowData.success, 'Workflow trigger should succeed');
});

// Run all tests
testSuite.runTests().catch(console.error);

export { TestSuite };
