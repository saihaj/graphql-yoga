import { Plugin, ResultProcessor, ResultProcessorInput } from './types.js'

export interface ResultProcessorPluginOptions<
  MediaType extends string = string,
> {
  mediaTypes: MediaType[]
  processResult: ResultProcessor
  match?(request: Request, result: ResultProcessorInput): MediaType | null
}

export function useResultProcessor<MediaType extends string = string>(
  options: ResultProcessorPluginOptions<MediaType>,
): Plugin {
  const matchFn = options.match || (() => true)
  return {
    onResultProcess({ request, result, setResultProcessor }) {
      if (matchFn(request, result)) {
        setResultProcessor(options.processResult)
      }
    },
  }
}
