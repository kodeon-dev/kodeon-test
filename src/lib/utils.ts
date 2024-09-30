export function classNames(...list: (string | undefined | (string | undefined)[])[]) {
  return list.flat().filter(s => typeof s === 'string').join(' ');
}
