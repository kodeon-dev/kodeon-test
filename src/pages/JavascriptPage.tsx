'use client';

import { javascript } from '@codemirror/lang-javascript';

import JavascriptWorker from '@/web-workers/javascript?worker';
import { localStorageKeys } from '@/constants';

import { CodeShell } from '@/components/code-shell';

const placeholder = `
# Welcome to Kodeon!
# Type your Python code here
# And hit 'Run' to run your code
`.trim();

export const pythonSampleBasic = /* Python */ `
import random
import time

#num = random.randint(3, 9)
num = int(input('Hello'))

print("The current time is " + str(time.time()))

print("Random number is " + str(num))

time.time()
`;

export const pythonSampleLoop = /* Python */ `
#num = random.randint(3, 9)
num = int(input('How many times should this loop?'))

for i in range(num):
  print("Loop number #" + str(i + 1))
`;

export default function PythonPage() {
  return CodeShell({
    lang: 'javascript',
    workerClass: JavascriptWorker,
    highlight: javascript,
    localStorageKey: localStorageKeys.code.pythonLastEdited,
    filename: 'main.js',
    placeholder,
    sampleCode: {
      Basic: pythonSampleBasic,
      Loop: pythonSampleLoop,
    },
  });
}
