import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { localStorageKeys } from '@/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function classNames(...list: (string | undefined | (string | undefined)[])[]) {
  return list
    .flat()
    .filter((s) => typeof s === 'string')
    .join(' ');
}

export function resetLocalStorage(type: 'javascript' | 'python') {
  'use client';

  const keys = {
    javascript: [localStorageKeys.code.javascriptLastEdited],
    python: [localStorageKeys.code.pythonLastEdited],
  };

  switch (type) {
    case 'javascript': {
      keys.python.forEach((key) => localStorage.removeItem(key));
      break;
    }
    case 'python': {
      keys.javascript.forEach((key) => localStorage.removeItem(key));
      break;
    }
  }
}
