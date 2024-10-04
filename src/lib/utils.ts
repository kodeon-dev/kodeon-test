import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function classNames(...list: (string | undefined | (string | undefined)[])[]) {
  return list.flat().filter(s => typeof s === 'string').join(' ');
}
