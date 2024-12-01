'use client';

import { javascript } from '@codemirror/lang-javascript';

import ClientWorker from '@/lib/client';
import JavascriptWorker from '@/web-workers/javascript?worker';
import { CodeShell } from '@/components/code-shell';
import { localStorageKeys } from '@/constants';

const placeholder = `
// Welcome to Kodeon!
// Type your Javascript code here
// And hit 'Run' to run your code
`.trim();

export const sampleBasic = /* Python */ `
var a = 1

do {
  a++;
} while (a < 10)

console.log(a)
`;

export default function PythonPage() {
  return CodeShell({
    lang: 'javascript',
    createClient: () => new ClientWorker(JavascriptWorker),
    highlight: javascript,
    localStorageKey: localStorageKeys.code.javascriptLastEdited,
    filename: 'main.js',
    placeholder,
    sampleCode: {
      Basic: sampleBasic,
    },
  });
}
