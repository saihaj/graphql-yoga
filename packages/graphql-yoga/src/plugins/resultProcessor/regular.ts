import { isAsyncIterable } from '@graphql-tools/utils'
import { getResponseInitByRespectingErrors } from '../../error.js'
import { FetchAPI } from '../../types.js'
import { ResultProcessorInput } from '../types.js'
import { canAccept } from './accept.js'
import { jsonStringifyResult } from './stringify.js'

export const regularResultMediaTypes = [
  'application/graphql-response+json' as const,
  'application/graphql+json' as const, // deprecated but might still be used
  'application/json' as const,
]

export type RegularResultMediaType = typeof regularResultMediaTypes[0]

export function isRegularResult(
  request: Request,
  result: ResultProcessorInput,
): RegularResultMediaType | null {
  if (isAsyncIterable(result)) {
    return null
  }

  const accept = canAccept(request, regularResultMediaTypes)
  return accept && accept.charset === 'utf-8' ? accept.mediaType : null
}

export function processRegularResult(
  mediaType: RegularResultMediaType,
  executionResult: ResultProcessorInput,
  fetchAPI: FetchAPI,
): Response {
  if (isAsyncIterable(executionResult)) {
    // shouldnt happen because of isRegularResult
    throw new Error('Cannot process stream result as regular')
  }

  const responseInit = getResponseInitByRespectingErrors(executionResult, {
    'Content-Type': mediaType + '; charset=utf-8',
  })

  if (responseInit.status >= 400 && mediaType === 'application/json') {
    // regular responses accepting 'application/json' are recommended to always respond with 200
    // see more: https://graphql.github.io/graphql-over-http/draft/#sel-EANNLDFAADHCAx5H
    responseInit.status = 200
  }

  const textEncoder = new fetchAPI.TextEncoder()
  const responseBody = jsonStringifyResult(executionResult)
  const decodedString = textEncoder.encode(responseBody)

  responseInit.headers['Content-Length'] = decodedString.byteLength.toString()

  return new fetchAPI.Response(decodedString, responseInit)
}
