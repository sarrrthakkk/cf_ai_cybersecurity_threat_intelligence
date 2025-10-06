// Workflow Engine Durable Object
// Handles automated workflows, incident response, and task orchestration

export class WorkflowEngine {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/trigger':
          return this.triggerWorkflow(request);
        case '/status':
          return this.getWorkflowStatus(request);
        case '/list':
          return this.listWorkflows(request);
        case '/cancel':
          return this.cancelWorkflow(request);
        case '/history':
          return this.getWorkflowHistory(request);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('WorkflowEngine error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async triggerWorkflow(request) {
    try {
      const { workflowType, parameters } = await request.json();
      
      if (!workflowType) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow type is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const workflowId = this.generateWorkflowId();
      const workflow = {
        id: workflowId,
        type: workflowType,
        status: 'running',
        parameters: parameters || {},
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        steps: [],
        results: {},
        metadata: {
          triggeredBy: parameters?.userId || 'system',
          priority: parameters?.priority || 'normal'
        }
      };

      await this.state.storage.put(`workflow_${workflowId}`, workflow);

      // Execute workflow based on type
      this.executeWorkflow(workflowId, workflowType, parameters);

      return new Response(JSON.stringify({
        success: true,
        workflowId: workflowId,
        workflow: workflow
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Trigger workflow error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async executeWorkflow(workflowId, workflowType, parameters) {
    try {
      const workflow = await this.state.storage.get(`workflow_${workflowId}`);
      if (!workflow) return;

      switch (workflowType) {
        case 'incident-response':
          await this.executeIncidentResponseWorkflow(workflowId, parameters);
          break;
        case 'threat-analysis':
          await this.executeThreatAnalysisWorkflow(workflowId, parameters);
          break;
        case 'security-report':
          await this.executeSecurityReportWorkflow(workflowId, parameters);
          break;
        case 'vulnerability-scan':
          await this.executeVulnerabilityScanWorkflow(workflowId, parameters);
          break;
        default:
          await this.executeGenericWorkflow(workflowId, parameters);
      }
    } catch (error) {
      console.error('Execute workflow error:', error);
      await this.updateWorkflowStatus(workflowId, 'failed', { error: error.message });
    }
  }

  async executeIncidentResponseWorkflow(workflowId, parameters) {
    const steps = [
      { name: 'assess', description: 'Assess incident severity' },
      { name: 'contain', description: 'Contain the threat' },
      { name: 'eradicate', description: 'Remove threat from environment' },
      { name: 'recover', description: 'Restore normal operations' },
      { name: 'lessons', description: 'Document lessons learned' }
    ];

    for (const step of steps) {
      await this.addWorkflowStep(workflowId, step.name, 'running', step.description);
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.addWorkflowStep(workflowId, step.name, 'completed', step.description);
    }

    await this.updateWorkflowStatus(workflowId, 'completed', {
      message: 'Incident response workflow completed successfully'
    });
  }

  async executeThreatAnalysisWorkflow(workflowId, parameters) {
    const steps = [
      { name: 'collect', description: 'Collect threat indicators' },
      { name: 'analyze', description: 'Analyze threat patterns' },
      { name: 'correlate', description: 'Correlate with known threats' },
      { name: 'assess', description: 'Assess risk level' },
      { name: 'recommend', description: 'Generate recommendations' }
    ];

    for (const step of steps) {
      await this.addWorkflowStep(workflowId, step.name, 'running', step.description);
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await this.addWorkflowStep(workflowId, step.name, 'completed', step.description);
    }

    await this.updateWorkflowStatus(workflowId, 'completed', {
      message: 'Threat analysis workflow completed successfully'
    });
  }

  async executeSecurityReportWorkflow(workflowId, parameters) {
    const steps = [
      { name: 'gather', description: 'Gather security data' },
      { name: 'analyze', description: 'Analyze security metrics' },
      { name: 'generate', description: 'Generate report content' },
      { name: 'format', description: 'Format report output' },
      { name: 'deliver', description: 'Deliver report to stakeholders' }
    ];

    for (const step of steps) {
      await this.addWorkflowStep(workflowId, step.name, 'running', step.description);
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      await this.addWorkflowStep(workflowId, step.name, 'completed', step.description);
    }

    await this.updateWorkflowStatus(workflowId, 'completed', {
      message: 'Security report workflow completed successfully'
    });
  }

  async executeVulnerabilityScanWorkflow(workflowId, parameters) {
    const steps = [
      { name: 'discovery', description: 'Discover assets and services' },
      { name: 'scan', description: 'Scan for vulnerabilities' },
      { name: 'validate', description: 'Validate findings' },
      { name: 'prioritize', description: 'Prioritize vulnerabilities' },
      { name: 'report', description: 'Generate vulnerability report' }
    ];

    for (const step of steps) {
      await this.addWorkflowStep(workflowId, step.name, 'running', step.description);
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await this.addWorkflowStep(workflowId, step.name, 'completed', step.description);
    }

    await this.updateWorkflowStatus(workflowId, 'completed', {
      message: 'Vulnerability scan workflow completed successfully'
    });
  }

  async executeGenericWorkflow(workflowId, parameters) {
    const steps = [
      { name: 'initialize', description: 'Initialize workflow' },
      { name: 'process', description: 'Process parameters' },
      { name: 'execute', description: 'Execute main logic' },
      { name: 'finalize', description: 'Finalize results' }
    ];

    for (const step of steps) {
      await this.addWorkflowStep(workflowId, step.name, 'running', step.description);
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.addWorkflowStep(workflowId, step.name, 'completed', step.description);
    }

    await this.updateWorkflowStatus(workflowId, 'completed', {
      message: 'Generic workflow completed successfully'
    });
  }

  async addWorkflowStep(workflowId, stepName, status, description) {
    const workflow = await this.state.storage.get(`workflow_${workflowId}`);
    if (!workflow) return;

    const step = {
      name: stepName,
      status: status,
      description: description,
      timestamp: new Date().toISOString()
    };

    workflow.steps.push(step);
    await this.state.storage.put(`workflow_${workflowId}`, workflow);
  }

  async updateWorkflowStatus(workflowId, status, results = {}) {
    const workflow = await this.state.storage.get(`workflow_${workflowId}`);
    if (!workflow) return;

    workflow.status = status;
    workflow.results = { ...workflow.results, ...results };
    
    if (status === 'completed' || status === 'failed') {
      workflow.completedAt = new Date().toISOString();
    }

    await this.state.storage.put(`workflow_${workflowId}`, workflow);
  }

  async getWorkflowStatus(request) {
    try {
      const url = new URL(request.url);
      const workflowId = url.searchParams.get('workflowId');
      
      if (!workflowId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const workflow = await this.state.storage.get(`workflow_${workflowId}`);
      
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
        workflow: workflow
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get workflow status error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
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
      const limit = parseInt(url.searchParams.get('limit')) || 50;

      const workflows = await this.getAllWorkflows();
      
      let filteredWorkflows = workflows;
      if (status) {
        filteredWorkflows = workflows.filter(workflow => workflow.status === status);
      }

      // Sort by created date (newest first) and limit
      const sortedWorkflows = filteredWorkflows
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

      return new Response(JSON.stringify({
        success: true,
        workflows: sortedWorkflows,
        total: filteredWorkflows.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('List workflows error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async cancelWorkflow(request) {
    try {
      const url = new URL(request.url);
      const workflowId = url.searchParams.get('workflowId');
      
      if (!workflowId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const workflow = await this.state.storage.get(`workflow_${workflowId}`);
      
      if (!workflow) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Workflow not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (workflow.status === 'completed' || workflow.status === 'failed') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cannot cancel completed or failed workflow'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await this.updateWorkflowStatus(workflowId, 'cancelled', {
        message: 'Workflow cancelled by user'
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Workflow cancelled successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Cancel workflow error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getWorkflowHistory(request) {
    try {
      const url = new URL(request.url);
      const workflowType = url.searchParams.get('type');
      const limit = parseInt(url.searchParams.get('limit')) || 100;

      const workflows = await this.getAllWorkflows();
      
      let filteredWorkflows = workflows;
      if (workflowType) {
        filteredWorkflows = workflows.filter(workflow => workflow.type === workflowType);
      }

      // Sort by created date (newest first) and limit
      const sortedWorkflows = filteredWorkflows
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

      return new Response(JSON.stringify({
        success: true,
        workflows: sortedWorkflows,
        total: filteredWorkflows.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Get workflow history error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getAllWorkflows() {
    const workflows = [];
    const keys = await this.state.storage.list({ prefix: 'workflow_' });
    
    for (const [key, value] of keys) {
      workflows.push(value);
    }
    
    return workflows;
  }

  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
