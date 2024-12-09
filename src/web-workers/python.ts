import { loadPyodide, type PyodideInterface } from 'pyodide';

import { readMessage } from '@/lib/service-messages';
import { cleanErrorMessage } from '@/lib/worker-utils/python';
import type { WorkerRequestEvent, WorkerResponseEvent } from '@/lib/client';

declare const self: any; // eslint-disable-line @typescript-eslint/no-explicit-any

self.pyodide = undefined;

async function createPyodideWorker() {
  const pyodide = await loadPyodide();
  // await pyodide.loadPackage(["numpy", "pytz"]);
  return pyodide;
}

self.onmessage = async (event: WorkerRequestEvent) => {
  switch (event.data?.action) {
    case 'PREPARE': {
      if (!self.pyodide) {
        const pyodide = (self.pyodide = await createPyodideWorker());
        pyodide.runPython('"Hello, world!"');
      }
      break;
    }

    case 'RUN': {
      const { id, code, filename } = event.data;

      let pyodide!: PyodideInterface;

      try {
        self.postMessage({
          id,
          action: 'STATUS',
          status: 'STARTED',
        } satisfies WorkerResponseEvent['data']);
        if (self.pyodide) {
          pyodide = self.pyodide;
        } else {
          pyodide = self.pyodide ?? (await createPyodideWorker());
        }

        // const script = ['from js import prompt as input;', code];

        pyodide.registerJsModule('js', {
          prompt(prompt: string) {
            self.postMessage({
              id,
              action: 'STDIN',
              prompt,
            } satisfies WorkerResponseEvent['data']);
            // BLOCKED until this function resolves
            return readMessage(id, '100ms');
          },
        });

        pyodide.setStdout({
          batched(data: string) {
            self.postMessage({
              id,
              action: 'STDOUT',
              data,
            } satisfies WorkerResponseEvent['data']);
          },
        });
        pyodide.setStderr({
          batched(data: string) {
            self.postMessage({
              id,
              action: 'STDERR',
              data,
            } satisfies WorkerResponseEvent['data']);
          },
        });

        pyodide.runPython('from js import prompt as input', {
          filename: '_prepare.py',
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'DEPENDENCIES',
        } satisfies WorkerResponseEvent['data']);
        await pyodide.loadPackagesFromImports(code, {
          messageCallback(data: string) {
            self.postMessage({
              id,
              action: 'STDOUT',
              data,
            } satisfies WorkerResponseEvent['data']);
          },
          errorCallback(data: string) {
            self.postMessage({
              id,
              action: 'STDOUT',
              data,
            } satisfies WorkerResponseEvent['data']);
          },
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'RUNNING',
        } satisfies WorkerResponseEvent['data']);
        const result = await pyodide.runPythonAsync(code, {
          filename,
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'COMPLETED',
          data: result,
        } satisfies WorkerResponseEvent['data']);
      } catch (err) {
        console.error(err);

        const { message } = err as unknown as { message: string };

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'CRASHED',
          data: cleanErrorMessage(message),
        } satisfies WorkerResponseEvent['data']);
      } finally {
        if (pyodide) {
          try {
            pyodide.runPython('import sys; del sys.modules["js"];', {
              filename: '_cleanup.py',
            });
            pyodide.unregisterJsModule('js');
          } catch (err) {
            console.error(err);
          }
        }
      }
      break;
    }

    case 'TEARDOWN': {
      self.pyodide = undefined;
      self.pyodide = await createPyodideWorker();
      break;
    }
  }
};
