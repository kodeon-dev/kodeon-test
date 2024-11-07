'use client';

import { python } from '@codemirror/lang-python';

import PythonWorker from '@/web-workers/python?worker';
import { localStorageKeys } from '@/constants';

import { CodeShell } from '@/components/code-shell';

const placeholder = `
# Welcome to Kodeon!
# Type your Python code here
# And hit 'Run' to run your code
`.trim();

export const sampleBasic = /* Python */ `
import random
import time

#num = random.randint(3, 9)
num = int(input('Hello'))

print("The current time is " + str(time.time()))

print("Random number is " + str(num))

time.time()
`;

export const sampleLoop = /* Python */ `
#num = random.randint(3, 9)
num = int(input('How many times should this loop?'))

for i in range(num):
  print("Loop number #" + str(i + 1))
`;

export default function PythonPage() {
  return CodeShell({
    lang: 'python',
    workerClass: PythonWorker,
    highlight: python,
    localStorageKey: localStorageKeys.code.pythonLastEdited,
    filename: 'main.py',
    placeholder,
    sampleCode: {
      Basic: sampleBasic,
      Loop: sampleLoop,
    },
  });
}
