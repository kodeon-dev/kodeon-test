import 'ses';

// import { readMessage } from '@/lib/service-messages';
import type { WorkerRequestEvent, WorkerResponseEvent } from '@/lib/client';

declare const self: any; // eslint-disable-line @typescript-eslint/no-explicit-any

self.onmessage = async (event: WorkerRequestEvent) => {
  switch (event.data?.action) {
    case 'RUN': {
      const { id, code } = event.data;

      try {
        const scope = new Compartment({
          globals: {
            print: harden(console.log),
          },
          __options__: true, // temporary migration affordance
        });

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'STARTED',
        } as WorkerResponseEvent['data']);

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'RUNNING',
        } as WorkerResponseEvent['data']);

        const result = await scope.evaluate(code);

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'COMPLETED',
          data: result,
        } as WorkerResponseEvent['data']);
      } catch (err) {
        console.error(err);

        self.postMessage({
          id,
          action: 'STATUS',
          status: 'CRASHED',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: (err as any).message ?? `${err}`,
        } as WorkerResponseEvent['data']);
      }
      break;
    }
  }
};
