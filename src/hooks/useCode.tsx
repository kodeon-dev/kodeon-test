import { useState } from 'react';

export function useCode(key: string): [string, (value: string) => void] {
  const [code, setCode] = useState(localStorage.getItem(key) ?? '');

  const setAndCacheCode = (value: string) => {
    localStorage.setItem(key, value);
    setCode(value);
  };

  return [code, setAndCacheCode];
}
