'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Code, Play, Square, /* Upload, Download */ } from "lucide-react"

import { CodeEditor, type RunCodeOutput } from './components/editor';
import { startCodeTask, stopWorker } from './lib/controller';
import { pythonSamples } from './samples';

// const languages = [
//   { value: 'javascript', label: 'JavaScript' },
//   { value: 'python', label: 'Python' },
//   { value: 'php', label: 'PHP' },
// ];

export default function App() {
  const [code, setCode] = useState(localStorage.getItem('last-edited') ?? pythonSamples.Basic.trim())
  // const [lang, setLang] = useState('python')
  const [runId, setRunId] = useState<string | undefined>()
  const [output, setOutput] = useState<RunCodeOutput[]>([])
  const [codeResult, setCodeResult] = useState<string | undefined>()
  const [codeErr, setCodeErr] = useState<string | undefined>()

  useEffect(() => {
    localStorage.setItem('last-edited', code)
  }, [
    code,
  ]);

  // const supportsServiceWorkers = 'serviceWorker' in navigator
  // console.log('supportsServiceWorkers', supportsServiceWorkers)

  async function handleRun() {
    const id = Date.now().toString();
    setRunId(id);

    let run: RunCodeOutput[] = []
    setCodeResult(undefined);
    setCodeErr(undefined);
    setOutput([]);

    function pushOutput(add: RunCodeOutput) {
      setOutput(run.concat(add));
      run = run.concat(add);
    }

    try {
      await startCodeTask({
        engine: 'PYTHON',
        id,
        code,
        status(status, message) {
          switch (status) {
            case 'STARTED': {
              pushOutput({ type: 'STATUS', key: status, label: 'Starting...', msg: message });
              break;
            }
            case 'DEPENDENCIES': {
              pushOutput({ type: 'STATUS', key: status, label: 'Loading dependencies...', msg: message });
              break;
            }
            case 'RUNNING': {
              pushOutput({ type: 'STATUS', key: status, label: 'Running...', msg: message });
              break;
            }
            case 'COMPLETED': {
              pushOutput({ type: 'STATUS', key: status, label: 'Completed!' });
              if (message) {
                setCodeResult(message)
              }
              break;
            }
            case 'CRASHED': {
              pushOutput({ type: 'STATUS', key: status, label: 'Crashed!' });
              if (message) {
                setCodeErr(message)
              }
              break;
            }
          }
        },
        stdin(prompt, write) {
          pushOutput({ type: 'STDIN', prompt, write })
        },
        stdout(data) {
          pushOutput({ type: 'STDOUT', msg: data })
        },
        stderr(data) {
          pushOutput({ type: 'STDERR', msg: data })
        },
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (typeof err.message === 'string') {
        setCodeErr(err.message)
      }
      pushOutput({ type: 'STATUS', key: 'CRASHED', label: 'Crashed!' });
    } finally {
      setRunId(undefined);
    }
  }

  async function handleStop() {
    if (typeof runId === 'string') {
      setOutput(output.concat({ type: 'STATUS', key: 'STOPPED', label: 'Stopped!' }));
      stopWorker('PYTHON');

      setRunId(undefined);
      setCodeResult(undefined);
      setCodeErr(undefined);
    }
  }

  function setSampleCode(code: string) {
    setCode(code.trim())
    setRunId(undefined);
    setCodeResult(undefined);
    setCodeErr(undefined);
    setOutput([]);
  }

  function handleKeypress(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      localStorage.setItem('last-edited', code)
    }

    if (e.shiftKey && e.key.toLowerCase() === 'enter') {
      handleRun()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeypress);
    return () => document.removeEventListener('keydown', handleKeypress);
  })

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
        <h1 className="text-2xl font-mono font-bold">
          kodeon
        </h1>
      </nav>

      <Menubar className="px-2 py-6 border-b bg-gray-200 dark:bg-gray-700">
        <div className="w-full flex items-center">
          <div className="flex-1">
            {/* <Button className="bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500" variant="outline" size="icon">
              <Upload className="w-4 h-4" />
              <span className="sr-only">Import code</span>
            </Button>
            <Button className="bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500" variant="outline" size="icon">
              <Download className="w-4 h-4" />
              <span className="sr-only">Export code</span>
            </Button> */}
          </div>
          <div className="flex-1 flex justify-center">
            {runId ? (
              <Button
                className="px-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
                onClick={handleStop}
                size="sm"
                variant="ghost">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
              </Button>
            ): (
              <Button
                className="px-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
                onClick={handleRun}
                variant="ghost">
                  <Play className="w-4 h-4 mr-2" />
                  Run
              </Button>
            )}
          </div>
          <div className="flex-1 flex justify-end space-x-2">
            <MenubarMenu>
              <MenubarTrigger className="bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">
                <Code className="w-4 h-4 mr-2" />
                Code samples
              </MenubarTrigger>
              <MenubarContent className="bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">
                {Object.entries(pythonSamples).map(([ label, code ]) => (
                  <MenubarItem
                    className="bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
                    key={label}
                    onClick={() => setSampleCode(code)}>
                      {label}
                  </MenubarItem>
                ))}
              </MenubarContent>
            </MenubarMenu>
          </div>
        </div>
      </Menubar>

      <CodeEditor
        value={code}
        onValueUpdated={setCode}
        output={output}
        // onStdinSend={codeStdinCallback}
        result={codeResult}
        err={codeErr}
      />
    </div>
  )
}
