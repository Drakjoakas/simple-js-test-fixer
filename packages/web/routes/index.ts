import { Router } from 'express';
import { MainController } from '../controllers';

export class MainRouter {
  private controller: MainController;
  private router: Router;

  constructor() {
    this.controller = new MainController();
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Frontend: Discovery endpoints
    this.router.get('/projects', (req, res) => this.controller.getProjects(req, res));
    this.router.get('/pipelines', (req, res) => this.controller.getPipelines(req, res));
    this.router.get('/pipeline-details', (req, res) => this.controller.getPipelineDetails(req, res));

    // End-to-end workflow (using pipelineId path parameter)
    this.router.post('/fix/:pipelineId', (req, res) => this.controller.fixAndCreatePR(req, res));

    // Step-by-step workflow (using pipelineId path parameter)
    this.router.get('/failures/:pipelineId', (req, res) => this.controller.getTestFailures(req, res));
    this.router.get('/analyze/:pipelineId', (req, res) => this.controller.analyzeTestFailures(req, res));
    this.router.post('/generate-fixes', (req, res) => this.controller.generateFixes(req, res));
    this.router.post('/create-pr', (req, res) => this.controller.createPRFromProposal(req, res));
  }

  getRouter() {
    return this.router;
  }
}
