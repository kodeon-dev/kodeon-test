import 'ses';
import format from 'format-util';
import { readMessage } from 'sync-message';

// import { readMessage } from '@/lib/service-messages';
import { cleanErrorStack } from '@/lib/worker-utils/javascript';
import type { WorkerRequestEvent, WorkerResponseEvent } from '@/lib/client';

declare const self: any; // eslint-disable-line @typescript-eslint/no-explicit-any

function toMessageString(message: unknown, ...args: unknown[]) {
  let prompt: string;
  if (typeof message === 'string') {
    prompt = message;
  } else {
    prompt = '';
    args.unshift(message);
  }

  return format(prompt, ...args).trim();
}

self.onmessage = async (event: WorkerRequestEvent) => {
  switch (event.data?.action) {
    case 'RUN': {
      const { id, code, filename, channel } = event.data;
      // const lines = code.split('\n').length;

      try {
        const scope = new Compartment({
          globals: {
            console: Object.freeze({
              debug(message: unknown, ...args: unknown[]) {
                self.postMessage({
                  id,
                  action: 'STDOUT',
                  data: toMessageString(message, ...args),
                } satisfies WorkerResponseEvent['data']);
              },
              log(message: unknown, ...args: unknown[]) {
                self.postMessage({
                  id,
                  action: 'STDOUT',
                  data: toMessageString(message, ...args),
                } satisfies WorkerResponseEvent['data']);
              },
              warn(message: unknown, ...args: unknown[]) {
                self.postMessage({
                  id,
                  action: 'STDOUT',
                  data: toMessageString(message, ...args),
                } satisfies WorkerResponseEvent['data']);
              },
              error(message: unknown, ...args: unknown[]) {
                self.postMessage({
                  id,
                  action: 'STDERR',
                  data: toMessageString(message, ...args),
                } satisfies WorkerResponseEvent['data']);
              },
            }),
            prompt(prompt: string) {
              self.postMessage({
                id,
                action: 'STDIN',
                prompt,
              } as WorkerResponseEvent['data']);
              // BLOCKED until this function resolves
              return readMessage(channel, id);
            },
          },
          __options__: true, // temporary migration affordance
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'STARTED',
        } satisfies WorkerResponseEvent['data']);

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'RUNNING',
        } satisfies WorkerResponseEvent['data']);

        const result = await scope.evaluate(code);

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'COMPLETED',
          data: result,
        } satisfies WorkerResponseEvent['data']);
      } catch (err) {
        // console.error(err);

        const { message, stack } = err as unknown as {
          message: string;
          stack: string;
        };

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'CRASHED',
          err: {
            message,
            stack: cleanErrorStack(
              filename,
              stack
                .toString()
                .split('\n')
                .map((s) => s.trim()),
            ),
          },
        } satisfies WorkerResponseEvent['data']);
      }
      break;
    }
  }
};
