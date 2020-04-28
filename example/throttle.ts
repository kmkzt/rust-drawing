interface Options {
  leading?: boolean
  trailing?: boolean
}

export function throttle<T extends (...args: any) => any>(
  func: T,
  wait: number,
  options: Options = {}
): T {
  let context: Function | null
  let args: IArguments | null
  let result: ReturnType<T> | null
  let timeout = null
  let previous = 0

  const later = (): void => {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) {
      context = null
      args = null
    }
  }

  return function wrap(...wraparg: any): any {
    const now = Date.now()
    if (!previous && options.leading === false) previous = now
    const remaining = wait - (now - previous)
    context = this
    args = wraparg
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) {
        context = null
        args = null
      }
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  } as T
}
