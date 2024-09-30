import assert from 'http-assert-plus';

import PythonWorker from '../workers/python?worker'
import type { EventStatus, WorkerRequestEvent, WorkerResponseEvent } from './types'

type Engine = 'PYTHON';
const workers = new Map<Engine, Worker>()
const tasks = new Map<string, { resolve: () => void; reject: (err: Error) => void; }>();

function startWorker(engine: Engine) {
  if (workers.has(engine)) {
    return workers.get(engine)!;
  }

  switch (engine) {
    case 'PYTHON': {
      const worker = new PythonWorker();
      workers.set(engine, worker);
      return worker;
    }

    default: return undefined;
  }
}

export async function startCodeTask({ id, engine, code, status, stdout, stderr }: {
  id: string;
  engine: Engine;
  code: string;
  status: (status: EventStatus, data?: string) => void;
  stdout: (data: string) => void;
  stderr: (data: string) => void;
}): Promise<void> {
  const key = `${engine}#${id}`;

  const worker = startWorker(engine);
  assert(worker, `Failed to start worker for: ${engine}`);

  const promise = new Promise<void>((resolve, reject) => {
    tasks.set(key, { resolve, reject });
  });

  worker.onmessage = (event: WorkerResponseEvent) => {
    switch (event.data?.action) {
      case 'STATUS': {
        const { status: statusCode, data } = event.data;
        status(statusCode, data);

        if (statusCode === 'COMPLETED') {
          return tasks.get(key)?.resolve();
        }
        if (statusCode === 'CRASHED') {
          return tasks.get(key)?.resolve();
        }
        if (statusCode === 'CANCELLED') {
          return tasks.get(key)?.resolve();
        }
        break;
      }

      case 'STDOUT': {
        const { data } = event.data;
        stdout(data);
        break;
      }

      case 'STDERR': {
        const { data } = event.data;
        stderr(data);
        break;
      }
    }
  };

  worker.postMessage({
    id,
    action: 'RUN',
    code,
  } satisfies WorkerRequestEvent['data']);

  return promise.finally(() => {
    tasks.delete(key);
  });
}

export function stopCodeTask(engine: Engine, id: string) {
  const worker = workers.get(engine);
  assert(worker, `Failed to get worker for: ${engine}`);
  const run = tasks.get(`${engine}#${id}`);
  assert(run, `Failed to get task for: ${engine}#${id}`);

  worker.postMessage({
    id,
    action: 'STOP',
  } satisfies WorkerRequestEvent['data']);
}

export function stopWorker(engine: Engine) {
  if (workers.has(engine)) {
    const worker = workers.get(engine)!;
    worker.terminate();
  }
}
