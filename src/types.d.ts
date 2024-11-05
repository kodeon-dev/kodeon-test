export type EventStatus = 'STARTED' | 'DEPENDENCIES' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'CRASHED';

export interface WorkerRequestEvent {
  data?:
    | { id: string; action: 'RUN'; code: string }
    | { id: string; action: 'STDIN'; input: string }
    | { id: string; action: 'STOP' }
    | undefined;
}
export interface WorkerResponseEvent {
  data?:
    | { id: string; action: 'STATUS'; status: EventStatus; data?: string }
    | { id: string; action: 'STDIN'; prompt?: string }
    | { id: string; action: 'STDOUT'; data: string }
    | { id: string; action: 'STDERR'; data: string }
    | undefined;
}
