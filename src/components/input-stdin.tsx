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
  const [value, setValue] = useState('')
  const [hasSubmitted, setSubmitState] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(value);
    setSubmitState(true);
  }

  if (hasSubmitted) {
    if (prompt) {
      return <code>{prompt}{' '}{value}</code>;
    } else {
      return <code>{value}</code>;
    }
  } else {
    return (
      <form onSubmit={handleSubmit} className="flex flex-row font-mono text-base">
        {prompt && <span className="whitespace-pre-wrap">{prompt}&nbsp;</span>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-transparent border-none outline-none font-mono text-base p-0 m-0 w-full"
          style={{ caretColor: 'inherit' }}
        />
      </form>
    )
  }
}
