import { Request, Response } from 'express';
import { MainService } from '../services';

export class MainController {
  private mainService: MainService;

  constructor() {
    this.mainService = new MainService();
  }

  /**
   * End-to-end: Fetch, analyze, fix, and create PR
   * POST /api/fix
   * Body: { slug: string, build: number }
   */
  async fixAndCreatePR(req: Request, res: Response) {
    try {
      const {pipelineId} = req.params
      if (!pipelineId) {
        res.status(400).json({message: "Bad Request: Missing pipelinId"});
        return;
      }
      const result = await this.mainService.fixAndCreatePR(pipelineId);
      res.status(200).json({message: 'Operation Successful', result});
    } catch(error: any) {
      console.error('Error in fixAndCreatePR:', error);
      res.status(500).json({
        message: "Error while fixing and creating PR",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Get test failures from CircleCI
   * GET /api/failures?slug=gh/owner/repo&build=123
   */
  async getTestFailures(req: Request, res: Response) {
    try {
      const {pipelineId} = req.params
      if (!pipelineId) {
        res.status(400).json({message: "Bad Request: Missing pipelinId"});
        return;
      }
      const failures = await this.mainService.getTestFailures(pipelineId);
      res.status(200).json({
        message: 'Test failures retrieved successfully',
        count: failures.length,
        failures
      });
    } catch(error: any) {
      console.error('Error in getTestFailures:', error);
      res.status(500).json({
        message: "Error while fetching test failures",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Analyze test failures
   * GET /api/analyze?slug=gh/owner/repo&build=123
   */
  async analyzeTestFailures(req: Request, res: Response) {
    try {
      const {pipelineId} = req.params
      if (!pipelineId) {
        res.status(400).json({message: "Bad Request: Missing pipelinId"});
        return;
      }
      const analyzed = await this.mainService.analyzeTestFailures(pipelineId);
      res.status(200).json({
        message: 'Test failures analyzed successfully',
        count: analyzed.length,
        analyzed
      });
    } catch(error: any) {
      console.error('Error in analyzeTestFailures:', error);
      res.status(500).json({
        message: "Error while analyzing test failures",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Generate fixes for test failures
   * POST /api/generate-fixes
   * Body: { pipelineId: string, slug: string }
   */
  async generateFixes(req: Request, res: Response) {
    try {
      const {pipelineId, slug} = req.body;
      if (!pipelineId || !slug) {
        res.status(400).json({message: "Bad Request: Missing pipelineId or slug from body"});
        return;
      }
      const proposal = await this.mainService.generateFixes(pipelineId, slug);
      res.status(200).json({
        message: 'Fix proposal generated successfully',
        proposal
      });
    } catch(error: any) {
      console.error('Error in generateFixes:', error);
      res.status(500).json({
        message: "Error while generating fixes",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Create PR from a fix proposal
   * POST /api/create-pr
   * Body: { proposal: FixProposal }
   */
  async createPRFromProposal(req: Request, res: Response) {
    try {
      const {proposal} = req.body;
      if (!proposal) {
        res.status(400).json({message: "Bad Request: Missing proposal from body"});
        return;
      }
      const pr = await this.mainService.createPRFromProposal(proposal);
      res.status(201).json({
        message: 'Pull request created successfully',
        pr
      });
    } catch(error: any) {
      console.error('Error in createPRFromProposal:', error);
      res.status(500).json({
        message: "Error while creating pull request",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Get all CircleCI projects for the authenticated user
   * GET /api/projects
   */
  async getProjects(_req: Request, res: Response) {
    try {
      const projects = await this.mainService.getProjects();
      res.status(200).json({
        message: 'Projects retrieved successfully',
        count: projects.length,
        projects
      });
    } catch(error: any) {
      console.error('Error in getProjects:', error);
      res.status(500).json({
        message: "Error while fetching projects",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Get recent pipelines for a project
   * GET /api/pipelines?slug=gh/owner/repo&limit=20
   */
  async getPipelines(req: Request, res: Response) {
    try {
      const {slug, limit} = req.query;
      if (!slug) {
        res.status(400).json({message: "Bad Request: Missing slug from query parameters"});
        return;
      }
      const limitNum = limit ? parseInt(limit as string) : 20;
      const pipelines = await this.mainService.getPipelines(slug as string, limitNum);
      res.status(200).json({
        message: 'Pipelines retrieved successfully',
        count: pipelines.length,
        pipelines
      });
    } catch(error: any) {
      console.error('Error in getPipelines:', error);
      res.status(500).json({
        message: "Error while fetching pipelines",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }

  /**
   * Get detailed pipeline information with workflows and jobs
   * GET /api/pipeline-details?slug=gh/owner/repo&pipeline=123
   */
  async getPipelineDetails(req: Request, res: Response) {
    try {
      const {slug, pipeline} = req.query;
      if (!slug || !pipeline) {
        res.status(400).json({message: "Bad Request: Missing slug or pipeline from query parameters"});
        return;
      }
      const details = await this.mainService.getPipelineDetails(slug as string, parseInt(pipeline as string));
      res.status(200).json({
        message: 'Pipeline details retrieved successfully',
        details
      });
    } catch(error: any) {
      console.error('Error in getPipelineDetails:', error);
      res.status(500).json({
        message: "Error while fetching pipeline details",
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    }
  }
}