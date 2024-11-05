/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const messages = new Map<string, string>();

self.addEventListener('install', (/* event */) => {
  // console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // console.log('Service Worker: Activated');
  // Cleanup or initialization work when the service worker takes control.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event) => {
  // console.log(event.request.method, event.request.url);
  if (event.request.url.endsWith('/stdin/read') || event.request.url.endsWith('/stdin/write')) {
    event.respondWith(handlePostRequest(event.request));
    return;
  }
});

function assert(value: unknown, err: Error): asserts value {
  if (!value) {
    throw err;
  }
}

async function handlePostRequest(request: Request): Promise<Response> {
  try {
    if (request.url.endsWith('/read')) {
      const { messageId } = await request.json();
      assert(typeof messageId === 'string', new TypeError('Expected messageId to be a string'));

      let res: Response;

      // Get the message
      const value = messages.get(messageId);

      if (typeof value === 'string') {
        res = new Response(
          JSON.stringify({
            ok: true,
            messageId,
            value,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      } else {
        res = new Response(
          JSON.stringify({
            ok: true,
            messageId,
            error: 'No new messages',
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }

      // And immediately delete it before sending the response
      messages.delete(messageId);

      return res;
    } else if (request.url.endsWith('/write')) {
      const { messageId, value } = await request.json();
      assert(typeof messageId === 'string', new TypeError('Expected messageId to be a string'));
      assert(typeof value === 'string', new TypeError('Expected value to be a string'));

      messages.set(messageId, value);

      return new Response(
        JSON.stringify({
          ok: true,
          messageId,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Not found',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Something went wrong',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
