'use client';

import { useMemo } from 'react';
import CodeMirror, { EditorView, BasicSetupOptions } from '@uiw/react-codemirror';
import { tokyoNightStormInit } from '@uiw/codemirror-theme-tokyo-night-storm';
import { tags as t } from '@lezer/highlight';
import type { python } from '@codemirror/lang-python';

import { getConfig } from '@/lib/config';
import { useCodeWarnings } from '@/hooks/useCodeWarnings';

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
  filename: string;
  lang: 'javascript' | 'python';
  highlight: typeof python;
  placeholder?: string | undefined;
  value: string;
  onValueUpdated: (value: string) => void;
  output?: RunCodeOutput[];
  onStdinSend?: (value: string) => void | undefined;
}

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
    selection: '#004787',
    lineHighlight: 'rgb(34,34,45, 0.2)',
  },
  styles: [
    // { tag: t.lineComment, color: '#fff' },
    { tag: t.variableName, color: '#fff' },
  ],
});

export function CodeEditor(props: CodeEditorProps) {
  const config = useMemo(() => getConfig(), []);
  const warnings = useCodeWarnings(config);

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      <div className="flex-grow md:w-1/2 h-1/2 md:h-full">
        <div
          className="w-full h-full resize-none font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md overflow-y-auto"
          style={{ height: 'calc(100vh - 150px)' }}
        >
          <p className="flex flex-row items-center pt-3 px-3 font-mono text-sm">
            {props.filename.endsWith('.js') && <img className="h-4 w-4 me-2" src="/file_type_js_official.svg" />}
            {props.filename.endsWith('.py') && <img className="h-4 w-4 me-2" src="/file_type_python.svg" />}
            {props.filename}
          </p>
          <CodeMirror
            className="w-full p-3 font-mono text-sm"
            minHeight="90%"
            value={props.value}
            theme={theme}
            onChange={(value) => props.onValueUpdated(value)}
            autoFocus={true}
            extensions={[EditorView.lineWrapping, props.highlight()]}
            placeholder={props.placeholder}
            basicSetup={options}
            lang={props.lang}
          />
        </div>
      </div>
      <div
        className="flex-grow md:w-1/2 h-1/2 md:h-full border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 overflow-y-auto"
        style={{ height: 'calc(100vh - 150px)' }}
      >
        <p className="pt-3 px-3 font-mono text-sm">Output</p>
        <pre className="flex flex-col p-3 whitespace-pre-wrap font-mono text-base">
          {warnings}
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
                if (msg === '') {
                  return (
                    <code key={i}>
                      <br />
                    </code>
                  );
                } else {
                  return <code key={i}>{msg}</code>;
                }
              }

              case 'STDERR': {
                const { msg } = line;
                if (msg === '') {
                  return (
                    <code key={i}>
                      <br />
                    </code>
                  );
                } else {
                  return (
                    <code className="text-red-700" key={i}>
                      {msg}
                    </code>
                  );
                }
              }
            }
          })}
        </pre>
      </div>
    </div>
  );
}
