import assert from 'http-assert-plus';
import { loadPyodide, type PyodideInterface } from 'pyodide';

import type { WorkerRequestEvent, WorkerResponseEvent } from '../lib/types';

declare const self: any; // eslint-disable-line @typescript-eslint/no-explicit-any

self.lock = undefined;

// eslint-disable-next-line no-async-promise-executor
self.pyodide = new Promise<PyodideInterface>(async (resolve, reject) => {
  try {
    const pyodide = await loadPyodide();
    // await pyodide.loadPackage(["numpy", "pytz"]);
    resolve(pyodide);
  } catch (err) {
    reject(err);
  }
});

self.onmessage = async (event: WorkerRequestEvent) => {
  switch (event.data?.action) {
    case 'RUN': {
      const { id, code } = event.data;
      const filename = 'main.py';

      let releaseLock: (() => void) | undefined = undefined;

      try {
        self.postMessage({ id, action: 'STATUS', status: 'STARTED' } as WorkerResponseEvent['data'])

        await self.lock;
        self.lock = new Promise<void>((resolve) => releaseLock = resolve);
        assert(typeof releaseLock === 'function', 'Failed to secure writelock');

        const pyodide: PyodideInterface = await self.pyodide;

        pyodide.setStdout({
          batched(data: string) {
            self.postMessage({ id, action: 'STDOUT', data } as WorkerResponseEvent['data'])
          },
        });
        pyodide.setStderr({
          batched(data: string) {
            self.postMessage({ id, action: 'STDERR', data } as WorkerResponseEvent['data'])
          },
        });

        self.postMessage({ id, action: 'STATUS', status: 'DEPENDENCIES' } as WorkerResponseEvent['data'])
        await pyodide.loadPackagesFromImports(code, {
          messageCallback(data: string) {
            self.postMessage({ id, action: 'STDOUT', data } as WorkerResponseEvent['data'])
          },
          errorCallback(data: string) {
            self.postMessage({ id, action: 'STDOUT', data } as WorkerResponseEvent['data'])
          },
        });

        self.postMessage({ id, action: 'STATUS', status: 'RUNNING' } as WorkerResponseEvent['data'])
        const result = await pyodide.runPythonAsync(code, {
          filename,
        });

        self.postMessage({ id, action: 'STATUS', status: 'COMPLETED', data: result } as WorkerResponseEvent['data'])
      } catch (err) {
        console.error(err)

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'CRASHED',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: (err as any).message ?? `${err}`,
        } as WorkerResponseEvent['data']);
      } finally {
        if (typeof releaseLock === 'function') {
          (releaseLock as (() => void))();
          self.lock = Promise.resolve();
        }
      }
      break;
    }
  }
}
