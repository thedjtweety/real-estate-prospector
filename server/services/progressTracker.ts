/**
 * Progress Tracking System
 * 
 * Provides real-time progress updates during multi-source data scraping.
 * Tracks each stage of the intelligence gathering process.
 */

export interface ProgressUpdate {
  stage: string;
  status: 'in_progress' | 'completed' | 'failed';
  message: string;
  percentage: number;
  timestamp: Date;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

export class ProgressTracker {
  private callback: ProgressCallback;
  private stages: string[] = [
    'Initializing search',
    'Building intelligent queries',
    'Searching Google',
    'Extracting contact information',
    'Deep scraping website',
    'Scraping NAR directory',
    'Identifying MLS associations',
    'Cross-referencing data',
    'Calculating confidence scores',
    'Finalizing results'
  ];
  private currentStageIndex: number = 0;

  constructor(callback: ProgressCallback) {
    this.callback = callback;
  }

  /**
   * Start a new stage
   */
  startStage(stage: string) {
    const stageIndex = this.stages.indexOf(stage);
    if (stageIndex !== -1) {
      this.currentStageIndex = stageIndex;
    }

    const percentage = Math.round((this.currentStageIndex / this.stages.length) * 100);

    this.callback({
      stage,
      status: 'in_progress',
      message: `${stage}...`,
      percentage,
      timestamp: new Date()
    });
  }

  /**
   * Complete the current stage
   */
  completeStage(stage: string, message?: string) {
    const percentage = Math.round(((this.currentStageIndex + 1) / this.stages.length) * 100);

    this.callback({
      stage,
      status: 'completed',
      message: message || `${stage} complete`,
      percentage,
      timestamp: new Date()
    });
  }

  /**
   * Mark stage as failed
   */
  failStage(stage: string, error: string) {
    this.callback({
      stage,
      status: 'failed',
      message: error,
      percentage: Math.round((this.currentStageIndex / this.stages.length) * 100),
      timestamp: new Date()
    });
  }

  /**
   * Update progress with custom message
   */
  update(stage: string, message: string, percentage?: number) {
    this.callback({
      stage,
      status: 'in_progress',
      message,
      percentage: percentage || Math.round((this.currentStageIndex / this.stages.length) * 100),
      timestamp: new Date()
    });
  }

  /**
   * Mark entire process as complete
   */
  complete() {
    this.callback({
      stage: 'Complete',
      status: 'completed',
      message: 'Search complete!',
      percentage: 100,
      timestamp: new Date()
    });
  }
}

/**
 * Create a progress tracker with callback
 */
export function createProgressTracker(callback: ProgressCallback): ProgressTracker {
  return new ProgressTracker(callback);
}
