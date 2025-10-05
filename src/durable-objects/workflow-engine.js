// Workflow Engine Durable Object
// Manages automated threat response workflows

export class WorkflowEngine {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/trigger':
        return this.triggerWorkflow(request);
      case '/status':
        return this.getWorkflowStatus(request);
      case '/list':
        return this.listWorkflows(request);
      case '/create':
        return this.createWorkflow(request);
      case '/update':
        return this.updateWorkflow(request);
      case '/delete':
        return this.deleteWorkflow(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  async triggerWorkflow(request) {
    try {
      const { workflowType, parameters, priority = 'normal' } = await request.json();

      const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get workflow definition
      const workflowDef = await this.getWorkflowDefinition(workflowType);
      
      if (!workflowDef) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow type not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create workflow instance
      const workflowInstance = {
        id: workflowId,
        type: workflowType,
        status: 'running',
        priority,
        createdAt: Date.now(),
        startedAt: Date.now(),
        parameters,
        steps: workflowDef.steps,
        currentStep: 0,
        results: [],
        errors: [],
        metadata: {
          triggeredBy: parameters.userId || 'system',
          context: parameters.context || {}
        }
      };

      // Store workflow instance
      await this.state.storage.put(workflowId, workflowInstance);

      // Execute workflow asynchronously
      this.executeWorkflow(workflowId, workflowInstance);

      return new Response(JSON.stringify({
        success: true,
        workflowId,
        status: 'started'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Trigger workflow error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to trigger workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async executeWorkflow(workflowId, workflowInstance) {
    try {
      for (let i = 0; i < workflowInstance.steps.length; i++) {
        const step = workflowInstance.steps[i];
        
        // Update current step
        workflowInstance.currentStep = i;
        await this.state.storage.put(workflowId, workflowInstance);

        // Execute step
        const stepResult = await this.executeStep(step, workflowInstance.parameters);
        
        // Store step result
        workflowInstance.results.push({
          stepIndex: i,
          stepName: step.name,
          result: stepResult,
          timestamp: Date.now()
        });

        // Check if step failed
        if (stepResult.error) {
          workflowInstance.status = 'failed';
          workflowInstance.errors.push({
            step: step.name,
            error: stepResult.error,
            timestamp: Date.now()
          });
          break;
        }

        // Check if workflow should stop
        if (stepResult.stop) {
          workflowInstance.status = 'completed';
          break;
        }
      }

      // Mark as completed if no errors
      if (workflowInstance.status === 'running') {
        workflowInstance.status = 'completed';
      }

      workflowInstance.completedAt = Date.now();
      await this.state.storage.put(workflowId, workflowInstance);

    } catch (error) {
      console.error('Execute workflow error:', error);
      
      workflowInstance.status = 'failed';
      workflowInstance.errors.push({
        step: 'workflow_execution',
        error: error.message,
        timestamp: Date.now()
      });
      
      await this.state.storage.put(workflowId, workflowInstance);
    }
  }

  async executeStep(step, parameters) {
    try {
      switch (step.type) {
        case 'ai_analysis':
          return await this.executeAIAnalysis(step, parameters);
        
        case 'threat_correlation':
          return await this.executeThreatCorrelation(step, parameters);
        
        case 'notification':
          return await this.executeNotification(step, parameters);
        
        case 'data_collection':
          return await this.executeDataCollection(step, parameters);
        
        case 'response_generation':
          return await this.executeResponseGeneration(step, parameters);
        
        case 'integration':
          return await this.executeIntegration(step, parameters);
        
        default:
          return { error: `Unknown step type: ${step.type}` };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async executeAIAnalysis(step, parameters) {
    try {
      const prompt = step.config.prompt || 'Analyze the threat data and provide insights.';
      
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: JSON.stringify(parameters.threatData || parameters)
          }
        ],
        max_tokens: step.config.maxTokens || 2048,
        temperature: step.config.temperature || 0.7
      });

      return {
        success: true,
        analysis: response.response,
        confidence: step.config.confidence || 0.8
      };

    } catch (error) {
      return { error: `AI analysis failed: ${error.message}` };
    }
  }

  async executeThreatCorrelation(step, parameters) {
    try {
      // Get threat database
      const threatDb = this.env.THREAT_DATABASE.get(
        this.env.THREAT_DATABASE.idFromName('main-db')
      );

      const correlationResult = await threatDb.fetch(
        new Request(`/correlate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threatId: parameters.threatId,
            correlationType: step.config.correlationType || 'similar'
          })
        })
      );

      const result = await correlationResult.json();

      return {
        success: true,
        correlations: result.correlatedThreats || [],
        count: result.total || 0
      };

    } catch (error) {
      return { error: `Threat correlation failed: ${error.message}` };
    }
  }

  async executeNotification(step, parameters) {
    try {
      const notification = {
        type: step.config.notificationType || 'alert',
        title: step.config.title || 'Threat Alert',
        message: parameters.message || 'A threat has been detected',
        recipients: step.config.recipients || [],
        priority: step.config.priority || 'medium',
        timestamp: Date.now()
      };

      // Store notification
      await this.state.storage.put(`notification_${Date.now()}`, notification);

      // Send via webhook if configured
      if (step.config.webhook) {
        await fetch(step.config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        });
      }

      return {
        success: true,
        notificationId: notification.id,
        sent: true
      };

    } catch (error) {
      return { error: `Notification failed: ${error.message}` };
    }
  }

  async executeDataCollection(step, parameters) {
    try {
      const dataSources = step.config.sources || [];
      const collectedData = [];

      for (const source of dataSources) {
        try {
          const response = await fetch(source.url, {
            method: source.method || 'GET',
            headers: source.headers || {}
          });

          if (response.ok) {
            const data = await response.json();
            collectedData.push({
              source: source.name,
              data,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error(`Data collection from ${source.name} failed:`, error);
        }
      }

      return {
        success: true,
        data: collectedData,
        count: collectedData.length
      };

    } catch (error) {
      return { error: `Data collection failed: ${error.message}` };
    }
  }

  async executeResponseGeneration(step, parameters) {
    try {
      const prompt = step.config.prompt || 'Generate an automated response to this threat.';
      
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are an AI security response coordinator. Based on the threat analysis, generate:
1. Immediate Actions: Urgent steps to contain the threat
2. Investigation Steps: Detailed investigation procedures
3. Communication Plan: Who to notify and when
4. Recovery Procedures: Steps to restore normal operations
5. Prevention Measures: Long-term security improvements
6. Documentation Requirements: What to document and report

Provide a structured response plan with timelines and responsibilities.`
          },
          {
            role: 'user',
            content: `Threat Analysis: ${JSON.stringify(parameters.analysis || parameters)}`
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      });

      return {
        success: true,
        response: response.response,
        actions: this.extractActions(response.response)
      };

    } catch (error) {
      return { error: `Response generation failed: ${error.message}` };
    }
  }

  async executeIntegration(step, parameters) {
    try {
      const integration = step.config;
      
      // Execute integration based on type
      switch (integration.type) {
        case 'webhook':
          return await this.executeWebhookIntegration(integration, parameters);
        
        case 'api':
          return await this.executeAPIIntegration(integration, parameters);
        
        case 'database':
          return await this.executeDatabaseIntegration(integration, parameters);
        
        default:
          return { error: `Unknown integration type: ${integration.type}` };
      }

    } catch (error) {
      return { error: `Integration failed: ${error.message}` };
    }
  }

  async executeWebhookIntegration(integration, parameters) {
    try {
      const response = await fetch(integration.url, {
        method: integration.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...integration.headers
        },
        body: JSON.stringify(parameters)
      });

      return {
        success: response.ok,
        status: response.status,
        data: await response.text()
      };

    } catch (error) {
      return { error: `Webhook integration failed: ${error.message}` };
    }
  }

  async executeAPIIntegration(integration, parameters) {
    try {
      // Implement API integration logic
      return {
        success: true,
        message: 'API integration executed'
      };

    } catch (error) {
      return { error: `API integration failed: ${error.message}` };
    }
  }

  async executeDatabaseIntegration(integration, parameters) {
    try {
      // Implement database integration logic
      return {
        success: true,
        message: 'Database integration executed'
      };

    } catch (error) {
      return { error: `Database integration failed: ${error.message}` };
    }
  }

  async getWorkflowDefinition(workflowType) {
    const definitions = {
      'threat-analysis': {
        name: 'Threat Analysis Workflow',
        steps: [
          {
            name: 'ai_analysis',
            type: 'ai_analysis',
            config: {
              prompt: 'Analyze the threat data and provide detailed insights.',
              maxTokens: 2048,
              temperature: 0.7
            }
          },
          {
            name: 'threat_correlation',
            type: 'threat_correlation',
            config: {
              correlationType: 'similar'
            }
          },
          {
            name: 'response_generation',
            type: 'response_generation',
            config: {
              prompt: 'Generate automated response recommendations.'
            }
          }
        ]
      },
      'incident-response': {
        name: 'Incident Response Workflow',
        steps: [
          {
            name: 'data_collection',
            type: 'data_collection',
            config: {
              sources: [
                { name: 'threat_feed', url: 'https://api.threatfeed.com/feed' }
              ]
            }
          },
          {
            name: 'ai_analysis',
            type: 'ai_analysis',
            config: {
              prompt: 'Analyze incident data and determine severity.'
            }
          },
          {
            name: 'notification',
            type: 'notification',
            config: {
              notificationType: 'alert',
              title: 'Security Incident Detected',
              priority: 'high'
            }
          },
          {
            name: 'response_generation',
            type: 'response_generation',
            config: {
              prompt: 'Generate incident response plan.'
            }
          }
        ]
      }
    };

    return definitions[workflowType];
  }

  extractActions(response) {
    // Extract actionable items from AI response
    const actions = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('Action:') || line.includes('Step:') || line.includes('•')) {
        actions.push(line.trim());
      }
    }
    
    return actions;
  }

  async getWorkflowStatus(request) {
    try {
      const url = new URL(request.url);
      const workflowId = url.searchParams.get('id');

      if (!workflowId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const workflow = await this.state.storage.get(workflowId);
      
      if (!workflow) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        workflow
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get workflow status error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get workflow status'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async listWorkflows(request) {
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const workflows = [];
      const keys = await this.state.storage.list();
      
      for (const [key, value] of keys) {
        if (key.startsWith('workflow_')) {
          if (!status || value.status === status) {
            workflows.push(value);
          }
        }
      }

      // Sort by creation time
      workflows.sort((a, b) => b.createdAt - a.createdAt);

      return new Response(JSON.stringify({
        success: true,
        workflows: workflows.slice(0, limit),
        total: workflows.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('List workflows error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to list workflows'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async createWorkflow(request) {
    try {
      const workflowDef = await request.json();
      
      const workflowId = `workflow_def_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      workflowDef.id = workflowId;
      workflowDef.createdAt = Date.now();

      await this.state.storage.put(workflowId, workflowDef);

      return new Response(JSON.stringify({
        success: true,
        workflowId,
        workflow: workflowDef
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Create workflow error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async updateWorkflow(request) {
    try {
      const { workflowId, updates } = await request.json();

      const workflow = await this.state.storage.get(workflowId);
      
      if (!workflow) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      Object.assign(workflow, updates);
      workflow.updatedAt = Date.now();

      await this.state.storage.put(workflowId, workflow);

      return new Response(JSON.stringify({
        success: true,
        workflow
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Update workflow error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async deleteWorkflow(request) {
    try {
      const url = new URL(request.url);
      const workflowId = url.searchParams.get('id');

      if (!workflowId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow ID required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const workflow = await this.state.storage.get(workflowId);
      
      if (!workflow) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await this.state.storage.delete(workflowId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Workflow deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Delete workflow error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
