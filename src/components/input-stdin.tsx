'use client';

import { useState, useRef, useEffect } from 'react';

interface InlineCodeInputProps {
  prompt?: string | undefined;
  onSubmit?: (input: string) => void;
}

/**
 * @link https://v0.dev/chat/cCcXxCS1VJw
 */
export function InputStdIn({ prompt, onSubmit }: InlineCodeInputProps) {
  const [value, setValue] = useState('');
  const [hasSubmitted, setSubmitState] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(value);
    setSubmitState(true);
  }

  if (hasSubmitted) {
    if (prompt) {
      return (
        <code>
          {prompt}
          <br />
          {value}
        </code>
      );
    } else {
      return <code>{value}</code>;
    }
  } else {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col font-mono text-base">
        {prompt && <span className="whitespace-pre-wrap">{prompt}</span>}
        <input
          ref={inputRef}
          type="text"
          placeholder="// Enter your text here"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-transparent border-none outline-none font-mono text-base focus:ring-0 focus:ring-slate-300 focus:shadow-slate-300 p-0 m-0 w-full"
          style={{ caretColor: 'inherit' }}
        />
      </form>
    );
  }
}
