'use client';

import { useMemo, type ReactNode } from 'react';
import CodeMirror, { EditorView, BasicSetupOptions } from '@uiw/react-codemirror';
import { tokyoNightStormInit } from '@uiw/codemirror-theme-tokyo-night-storm';
import { python } from '@codemirror/lang-python';

import { getConfig } from '@/lib/config';
import { InputStdIn } from './input-stdin';

export type RunCodeOutput =
  | { type: 'DEBUG'; msg: string }
  | {
      type: 'STDIN';
      prompt?: string | undefined;
      write: (value: string) => void;
    }
  | { type: 'STDOUT'; msg: string }
  | { type: 'STDERR'; msg: string };

export interface CodeEditorProps {
  placeholder?: string | undefined;
  value: string;
  onValueUpdated: (value: string) => void;
  output?: RunCodeOutput[];
  onStdinSend?: (value: string) => void | undefined;
}

const defaultPlaceholder = `
Welcome to Kodeon!
Type your Python code here
And hit 'Run' to run your code
`.trim();

const options: BasicSetupOptions = {
  lineNumbers: true,
  foldGutter: true,
  highlightActiveLineGutter: true,
  highlightSpecialChars: true,
  history: true,
  drawSelection: true,
  dropCursor: true,
  allowMultipleSelections: true,
  indentOnInput: true,
  syntaxHighlighting: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  rectangularSelection: true,
  highlightActiveLine: true,
  highlightSelectionMatches: true,
  closeBracketsKeymap: true,
  defaultKeymap: true,
  searchKeymap: true,
  historyKeymap: true,
  foldKeymap: true,
  completionKeymap: true,
  lintKeymap: true,
};

const theme = tokyoNightStormInit({
  settings: {
    background: '#1f2937',
    gutterBackground: '#1f2937',
  },
});

function buildWarnings(config: ReturnType<typeof getConfig>) {
  const warnings: ReactNode[] = [];

  if (config.webWorkers.supported === false) {
    warnings.push(
      <code key="web-workers-not-supported" className="text-red-700">
        Web workers are not supported - your code will not execute.
      </code>,
    );
  }

  if (config.serviceWorkers.supported === false) {
    warnings.push(
      <code key="service-workers-not-supported" className="text-yellow-500">
        Service workers are not supported - you will not be able to enter input into your code.
      </code>,
    );
  } else if (config.serviceWorkers.enabled === false) {
    warnings.push(
      <code key="service-workers-not-enabled" className="text-yellow-500">
        Service workers are not enabled{' - '}
        <a className="underline decoration-dashed" href="#" onClick={() => window.location.reload()}>
          refresh your page
        </a>{' '}
        to restart them.
      </code>,
    );
  }

  return warnings;
}

export function CodeEditor(props: CodeEditorProps) {
  const config = useMemo(() => getConfig(), []);

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      <div className="flex-grow md:w-1/2 h-1/2 md:h-full">
        <div
          className="w-full h-full resize-none font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          style={{ minHeight: 'calc(100vh - 150px)' }}
        >
          <CodeMirror
            className="w-full h-full p-3 font-mono text-base"
            minHeight="100%"
            value={props.value}
            theme={theme}
            onChange={(value) => props.onValueUpdated(value)}
            autoFocus={true}
            extensions={[EditorView.lineWrapping, python()]}
            placeholder={props.placeholder ?? defaultPlaceholder}
            basicSetup={options}
            lang="python"
          />
        </div>
      </div>
      <div
        className="flex-grow md:w-1/2 h-1/2 md:h-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-100 dark:bg-gray-800 overflow-auto"
        style={{ minHeight: 'calc(100vh - 150px)' }}
      >
        <pre className="flex flex-col whitespace-pre-wrap font-mono text-base">
          {buildWarnings(config)}
          {props.output?.map((line, i) => {
            switch (line.type) {
              case 'DEBUG': {
                const { msg } = line;
                return (
                  <code key={i} className="text-sm text-slate-500">
                    {msg}
                  </code>
                );
              }

              case 'STDIN': {
                const { prompt, write } = line;
                return <InputStdIn key={i} prompt={prompt} onSubmit={write} />;
              }

              case 'STDOUT': {
                const { msg } = line;
                return <code key={i}>{msg}</code>;
              }

              case 'STDERR': {
                const { msg } = line;
                return (
                  <code className="text-red-700" key={i}>
                    {msg}
                  </code>
                );
              }
            }
          })}
        </pre>
      </div>
    </div>
  );
}
