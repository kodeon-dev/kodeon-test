import { loadPyodide, type PyodideInterface } from 'pyodide';
import { readMessage } from 'sync-message';

// import { readMessage } from '@/lib/service-messages';
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
      const { id, code, filename, channel } = event.data;

      let pyodide!: PyodideInterface;

      try {
        self.postMessage({
          id,
          action: 'STATUS',
          status: 'STARTED',
        } as WorkerResponseEvent['data']);
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
            } as WorkerResponseEvent['data']);
            // BLOCKED until this function resolves
            return readMessage(channel, id, { timeout: 100 });
          },
        });

        pyodide.setStdout({
          batched(data: string) {
            self.postMessage({
              id,
              action: 'STDOUT',
              data,
            } as WorkerResponseEvent['data']);
          },
        });
        pyodide.setStderr({
          batched(data: string) {
            self.postMessage({
              id,
              action: 'STDERR',
              data,
            } as WorkerResponseEvent['data']);
          },
        });

        pyodide.runPython('from js import prompt as input', {
          filename: '_prepare.py',
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'DEPENDENCIES',
        } as WorkerResponseEvent['data']);
        await pyodide.loadPackagesFromImports(code, {
          messageCallback(data: string) {
            self.postMessage({
              id,
              action: 'STDOUT',
              data,
            } as WorkerResponseEvent['data']);
          },
          errorCallback(data: string) {
            self.postMessage({
              id,
              action: 'STDOUT',
              data,
            } as WorkerResponseEvent['data']);
          },
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'RUNNING',
        } as WorkerResponseEvent['data']);
        const result = await pyodide.runPythonAsync(code, {
          filename,
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'COMPLETED',
          data: result,
        } as WorkerResponseEvent['data']);
      } catch (err) {
        console.error(err);

        const { message } = err as unknown as { message: string };

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'CRASHED',
          data: cleanErrorMessage(message),
        } as WorkerResponseEvent['data']);
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
