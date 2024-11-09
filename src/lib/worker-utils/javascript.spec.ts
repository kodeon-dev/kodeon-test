import { cleanErrorStack } from './javascript';

describe('#cleanErrorStack', () => {
  const cases: [string[], string[]][] = [
    [
      // Local - Dev server
      [
        'TypeError: console.ff is not a function',
        'at Object.eval (eval at <anonymous> (eval at makeEvaluate (http://localhost:3000/node_modules/.vite/deps/ses.js?v=0457b9fa:3612:27)), <anonymous>:1:9)',
        'at Object.eval (eval at makeEvaluate (http://localhost:3000/node_modules/.vite/deps/ses.js?v=0457b9fa:3612:27), <anonymous>:12:22)',
        'at safeEvaluate (http://localhost:3000/node_modules/.vite/deps/ses.js?v=0457b9fa:3665:14)',
        'at compartmentEvaluate (http://localhost:3000/node_modules/.vite/deps/ses.js?v=0457b9fa:5176:10)',
        'at Compartment2.evaluate (http://localhost:3000/node_modules/.vite/deps/ses.js?v=0457b9fa:5638:12)',
        'at self.onmessage (http://localhost:3000/src/web-workers/javascript.ts?worker_file&type=module:76:36)',
      ],
      ['at (main.js:1:9)'],
    ],
    [
      // Local - Preview server
      [
        'TypeError: console.ff is not a function',
        'at Object.eval (eval at <anonymous> (eval at ea (http://localhost:3000/assets/javascript-DCDcdJwS.js:7:1910)), <anonymous>:1:9)',
        'at Object.eval (eval at ea (http://localhost:3000/assets/javascript-DCDcdJwS.js:7:1910), <anonymous>:12:22)',
        'at safeEvaluate (http://localhost:3000/assets/javascript-DCDcdJwS.js:22:403)',
        'at ln (http://localhost:3000/assets/javascript-DCDcdJwS.js:27:9173)',
        'at s.evaluate (http://localhost:3000/assets/javascript-DCDcdJwS.js:27:14063)',
        'at self.onmessage (http://localhost:3000/assets/javascript-DCDcdJwS.js:33:6819)',
      ],
      ['at (main.js:1:9)'],
    ],
    [
      // Deployed
      [
        'TypeError: console.ff is not a function',
        'at Object.eval (eval at <anonymous> (eval at ea (https://app.kodeon.dev/assets/javascript-DCDcdJwS.js:7:1910)), <anonymous>:1:9)',
        'at Object.eval (eval at ea (https://app.kodeon.dev/assets/javascript-DCDcdJwS.js:7:1910), <anonymous>:12:22)',
        'at safeEvaluate (https://app.kodeon.dev/assets/javascript-DCDcdJwS.js:22:403)',
        'at ln (https://app.kodeon.dev/assets/javascript-DCDcdJwS.js:27:9173)',
        'at s.evaluate (https://app.kodeon.dev/assets/javascript-DCDcdJwS.js:27:14063)',
        'at self.onmessage (https://app.kodeon.dev/assets/javascript-DCDcdJwS.js:33:6819)',
      ],
      ['at (main.js:1:9)'],
    ],
  ];

  test.each(cases)('it should transform an error stack (%#)', (input, expected) => {
    const actual = cleanErrorStack('main.js', input);
    expect(actual).toEqual(expected);
  });
});
