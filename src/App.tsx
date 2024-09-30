import { useState } from 'react';
// import * as Select from '@radix-ui/react-select';
import * as Toolbar from '@radix-ui/react-toolbar';
// import { Play, Square, ChevronDown, Check } from 'lucide-react';
import { Play, Square } from 'lucide-react';

import { CodeEditor, type RunCodeOutput } from './components/editor';
import { startCodeTask, stopCodeTask } from './lib/controller';
import { pythonSample } from './samples';

// const languages = [
//   { value: 'javascript', label: 'JavaScript' },
//   { value: 'python', label: 'Python' },
//   { value: 'php', label: 'PHP' },
// ];

export default function App() {
  const [code, setCode] = useState(pythonSample.trim())
  // const [lang, setLang] = useState('python')
  const [runId, setRunId] = useState<string | undefined>(undefined)
  const [output, setOutput] = useState<RunCodeOutput[]>([])
  const [codeResult, setCodeResult] = useState<string | undefined>(undefined)
  const [codeErr, setCodeErr] = useState<string | undefined>(undefined)

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
              pushOutput({ type: 'STATUS', key: status, label: '🟡 Starting...', msg: message });
              break;
            }
            case 'DEPENDENCIES': {
              pushOutput({ type: 'STATUS', key: status, label: '🟠 Loading dependencies...', msg: message });
              break;
            }
            case 'RUNNING': {
              pushOutput({ type: 'STATUS', key: status, label: '🔵 Running...', msg: message });
              break;
            }
            case 'COMPLETED': {
              pushOutput({ type: 'STATUS', key: status, label: '🟢 Completed!' });
              if (message) {
                setCodeResult(message)
              }
              break;
            }
            case 'CRASHED': {
              pushOutput({ type: 'STATUS', key: status, label: '🔴 Crashed!' });
              if (message) {
                setCodeErr(message)
              }
              break;
            }
          }
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
      pushOutput({ type: 'STATUS', key: 'CRASHED', label: '🔴 Crashed!' });
    } finally {
      setRunId(undefined);
    }
  }

  async function handleStop() {
    if (typeof runId === 'string') {
      console.log('Trigger cancel event');
      setOutput(output.concat({ type: 'STATUS', key: 'STOPPED', label: '🛑 Stopped' }));
      stopCodeTask('PYTHON', runId);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">
          kodeon
        </h1>
      </nav>

      <Toolbar.Root className="flex items-center p-2 bg-gray-200 dark:bg-gray-700 overflow-x-auto">
        {/* <Select.Root value={lang} onValueChange={setLang}>
          <Select.Trigger className="inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 mr-2 focus:outline-none">
            <Select.Value />
            <Select.Icon className="ml-2">
              <ChevronDown className="h-4 w-4" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-gray-800 rounded-md shadow-lg">
              <Select.Viewport className="p-1">
                {languages.map((lang) => (
                  <Select.Item
                    key={lang.value}
                    value={lang.value}
                    className="relative flex items-center px-8 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md outline-none"
                  >
                    <Select.ItemText>{lang.label}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root> */}
        <div className="grow"/>
        <Toolbar.Button className="px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 mr-2 whitespace-nowrap flex items-center" onClick={handleRun}>
          <Play className="h-4 w-4 mr-2" />
          Run
        </Toolbar.Button>
        <Toolbar.Button className="px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 whitespace-nowrap flex items-center" onClick={handleStop}>
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Toolbar.Button>
      </Toolbar.Root>

      <CodeEditor
        value={code}
        onValueUpdated={setCode}
        output={output}
        result={codeResult}
        err={codeErr}
      />
    </div>
  )
}
