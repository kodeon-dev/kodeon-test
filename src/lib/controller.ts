import assert from 'http-assert-plus';

import PythonWorker from '../web-workers/python?worker'
import { writeMessage } from '../lib/service-messages';
import type { EventStatus, WorkerRequestEvent, WorkerResponseEvent } from './types'

type Engine = 'PYTHON';
const workers = new Map<string, Worker>()

export async function startCodeTask({ id, engine, code, status, stdin, stdout, stderr }: {
  id: string;
  engine: Engine;
  code: string;
  status: (status: EventStatus, data?: string) => void;
  stdin: (data: string | undefined, send: (input: string) => void) => void;
  stdout: (data: string) => void;
  stderr: (data: string) => void;
}): Promise<void> {
  assert(engine === 'PYTHON', 'Only PYTHON is supported');

  let worker = workers.get(engine);
  if (!worker) {
    worker = new PythonWorker();
    assert(worker, `Failed to start worker for: ${engine}`);
    workers.set(engine, worker);
  }

  let resolve: () => void;
  const promise = new Promise<void>((r1) => {
    resolve = r1;
  });

  worker.onmessage = (event: WorkerResponseEvent) => {
    switch (event.data?.action) {
      case 'STATUS': {
        const { status: statusCode, data } = event.data;
        status(statusCode, data);

        if (statusCode === 'COMPLETED') {
          return resolve();
        }
        if (statusCode === 'CRASHED') {
          return resolve();
        }
        if (statusCode === 'CANCELLED') {
          return resolve();
        }
        break;
      }

      case 'STDIN': {
        const { prompt } = event.data;
        stdin(prompt, (input: string) => {
          writeMessage(id, input).catch(err => console.error('writeMessage', err));
        });
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

  return promise;
}

export function stopWorker(engine: Engine) {
  const worker = workers.get(engine);

  if (worker) {
    worker.terminate();
    workers.delete(engine);
  }
}
