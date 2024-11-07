'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from '@/components/ui/menubar';

import ClientWorker from '@/lib/client';
import type PythonWorker from '@/web-workers/python?worker';
import { CodeEditor, type CodeEditorProps, type RunCodeOutput } from '@/components/editor';
import { useCode } from '@/hooks/useCode';

export interface CodeShellProps {
  localStorageKey: string;
  workerClass: typeof PythonWorker;
  lang: CodeEditorProps['lang'];
  filename: CodeEditorProps['filename'];
  placeholder?: CodeEditorProps['placeholder'];
  highlight: CodeEditorProps['highlight'];
  sampleCode?: Record<string, string>;
}

export function CodeShell(props: CodeShellProps) {
  const navigate = useNavigate();

  const [code, setCode] = useCode(props.localStorageKey);
  const [runId, setRunId] = useState<string>();
  const [output, setOutput] = useState<RunCodeOutput[]>([]);

  const client = useMemo(() => new ClientWorker(props.workerClass), [props.workerClass]);

  useEffect(() => {
    client.setup();
  }, [client]);

  async function handleRun() {
    const id = Date.now().toString();
    setRunId(id);

    let run: RunCodeOutput[] = [];
    setOutput([]);

    function pushOutput(...add: RunCodeOutput[]) {
      setOutput(run.concat(add));
      run = run.concat(add);
    }

    await new Promise<void>((resolve) => {
      client.run(
        { id, code, filename: props.filename },
        {
          onDebug: (message) => pushOutput({ type: 'DEBUG', msg: message }),
          onRunning: () => pushOutput({ type: 'DEBUG', msg: 'Running' }),
          onStdin: (prompt, write) => pushOutput({ type: 'STDIN', prompt, write }),
          onStdout: (data) => pushOutput({ type: 'STDOUT', msg: data }),
          onStderr: (data) => pushOutput({ type: 'STDERR', msg: data }),
          onCompleted(data) {
            pushOutput({ type: 'DEBUG', msg: 'Completed' });
            if (data) {
              pushOutput({ type: 'DEBUG', msg: 'The return value is:' });
              pushOutput({ type: 'STDOUT', msg: data });
            }

            resolve();
          },
          onException(err, stack) {
            pushOutput({ type: 'DEBUG', msg: 'Errored' });
            if (err) {
              pushOutput({
                type: 'STDERR',
                msg: ((a) => a.join('\n'))([err, ...(stack ?? [])]),
              });
            }

            resolve();
          },
        },
      );
    });

    setRunId(undefined);
  }

  function handleStop() {
    if (client.isRunning()) {
      setOutput(output.concat({ type: 'DEBUG', msg: 'Stopped' }));
      client.teardown();
      client.setup();
    }

    setRunId(undefined);
  }

  // function setSampleCode(code: string) {
  //   if (client.isRunning()) {
  //     handleStop();
  //   }
  //
  //   setCode(code.trim());
  //   setOutput([]);
  // }

  function handleKeypress(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      localStorage.setItem('last-edited', code);
    }

    if (!client.isRunning() && e.shiftKey && e.key.toLowerCase() === 'enter') {
      handleRun();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeypress);
    return () => document.removeEventListener('keydown', handleKeypress);
  });

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="flex items-center justify-between px-4 bg-gray-100 dark:bg-gray-800">
        <h1 className="text-2xl font-mono font-bold">kodeon</h1>
        <img className="h-16 w-16" src="/ChigwellIcon.png" />
      </nav>

      <Menubar className="px-2 py-6 border-b bg-gray-200 dark:bg-gray-700">
        <div className="w-full flex items-center">
          <div className="flex-1 flex flex-row">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Menu</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>New Tab</MenubarItem>
                  <MenubarItem>New Window</MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Share</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>Email link</MenubarItem>
                      <MenubarItem>Messages</MenubarItem>
                      <MenubarItem>Notes</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSeparator />
                  <MenubarItem>Print</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
          <div className="flex-1 flex justify-center">
            {runId ? (
              <Button
                className="px-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
                onClick={handleStop}
                size="sm"
                variant="ghost"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button
                className="px-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
                onClick={handleRun}
                variant="ghost"
              >
                <Play className="w-4 h-4 mr-2" />
                Run
              </Button>
            )}
          </div>
          <div className="flex-1 flex justify-end space-x-2">
            {/* {props.sampleCode && (
              <MenubarMenu>
                <MenubarTrigger>
                  <Code className="w-4 h-4 mr-2" />
                  Code samples
                </MenubarTrigger>
                <MenubarContent>
                  {Object.entries(props.sampleCode).map(([label, code]) => (
                    <MenubarItem key={label} onClick={() => setSampleCode(code)}>
                      {label}
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            )} */}

            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Languages</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => navigate('/javascript')}>
                    <img className="h-4 w-4 me-2" src="/file_type_js_official.svg" />
                    Javascript
                  </MenubarItem>
                  <MenubarItem onClick={() => navigate('/python')}>
                    <img className="h-4 w-4 me-2" src="/file_type_python.svg" />
                    Python
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>
      </Menubar>

      <CodeEditor
        lang={props.lang}
        filename={props.filename}
        placeholder={props.placeholder}
        highlight={props.highlight}
        value={code}
        onValueUpdated={setCode}
        output={output}
      />
    </div>
  );
}
