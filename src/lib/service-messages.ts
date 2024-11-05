import assert from 'http-assert-plus';
import ms from 'ms';

/**
 * Reads via SYNCHRONOUS XMLHTTPREQUEST
 * ONLY WORKS IN A WEB-WORKER - WILL ALWAYS 404 IN THE MAIN THREAD!
 */
export function readMessage(messageId: string, timeout: string): string {
  function checkTextmail(): string | undefined {
    try {
      // console.log('readMessage REQ', messageId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/stdin/read', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ messageId, timeout: ms(timeout) }));

      // console.log('readMessage RES', xhr.status, xhr.responseText)

      switch (xhr.status) {
        case 200: {
          const { value } = JSON.parse(xhr.responseText);
          assert(typeof value === 'string', 'Missing value from successful stdin read');
          return value;
        }

        case 404: {
          // You have no new messages
          return undefined;
        }

        default: {
          const { error } = JSON.parse(xhr.responseText);
          if (typeof error === 'string') {
            assert.fail(error);
          } else {
            assert.fail(new Error('Service worker API: Read failed'));
          }
        }
      }
    } catch (err) {
      console.error('readMessage REQ', err);
      return undefined;
    }
  }

  function wait(delay: string) {
    const start = Date.now();
    const end = ms(delay);
    while (Date.now() - start < end) {
      // Do nothing but wasting time
    }
  }

  while (true) {
    const result = checkTextmail();

    if (typeof result === 'string') {
      return result;
    } else {
      wait('1s');
    }
  }
}

/**
 * Writes via ASYNCHRONOUS XMLHTTPREQUEST
 */
export async function writeMessage(messageId: string, value: string) {
  // console.log('writeMessage REQ', messageId, value);

  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if ('serviceWorker' in window.navigator) {
      // @ts-ignore
      await window.navigator.serviceWorker.ready;
    }
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/stdin/write', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        // console.log('writeMessage RES', xhr.status, xhr.responseText)

        switch (xhr.status) {
          case 200:
            return resolve();
          case 404:
            return reject(new Error('Service worker API: Not found'));
          default: {
            const { error } = JSON.parse(xhr.responseText);
            if (typeof error === 'string') {
              return reject(new Error(error));
            } else {
              return reject(new Error('Service worker API: Write failed'));
            }
          }
        }
      }
    };

    xhr.send(JSON.stringify({ messageId, value }));
  });
}
