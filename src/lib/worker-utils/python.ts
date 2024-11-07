export function cleanErrorMessage(message: string): string {
  const [start, ...lines] = message.split('\n');

  let segments: string[][] = [];
  let i = 0;

  for (const line of lines) {
    if (line.startsWith('  File "')) {
      segments.push([]);
      i = segments.length - 1;
    }

    segments[i].push(line);
  }

  segments = segments.filter((section) => section[0].startsWith('  File "main.py"'));

  return [start].concat(segments.flat()).join('\n');
}
