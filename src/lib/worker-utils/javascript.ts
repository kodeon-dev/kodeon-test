// eslint-disable-next-line no-useless-escape
const ERR_REGEX = /eval at <anonymous> \(eval at ([A-z]+) \(([^\)]+)\)\), /g;

export function cleanErrorStack(filename: string, stack: string[]) {
  return stack.reduce((list, line) => {
    if (ERR_REGEX.test(line)) {
      const transformed = line
        .replace(ERR_REGEX, '')
        .replace('<anonymous>:', `${filename}:`)
        .replace(/Object\.eval\s*/, '');

      list.push(transformed);
    }

    return list;
  }, [] as string[]);
}
