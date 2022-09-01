interface Accept<T extends string = string> {
  mediaType: T
  charset: string
}

/**
 * Parses the request accept header and returns the accepted media-types with charset
 * sorted by relevance (import important ones on the top).
 */
export function getAccepts(request: Request): Accept[] {
  const accepts: Accept[] = []

  for (const accept of (request.headers.get('accept') || '*/*')
    .replace(/\s/g, '')
    .toLowerCase()
    .split(',')) {
    const [mediaType, ...params] = accept.split(';')
    const charset =
      params?.find((param) => param.includes('charset=')) || 'charset=utf-8' // utf-8 is assumed when not specified;
    accepts.push({ mediaType, charset: charset.replace('charset=', '') })
    // TODO: parse and use the "q" parameter for weighing
  }

  return accepts
}

/**
 * Checks whether the request accepts any of the provided media-types and returns
 * a the highest match by priority, or null if none match.
 *
 * TODO: also consider partial media-type matches like application/*.
 */
export function canAccept<T extends string = string>(
  request: Request,
  mediaTypes: T[],
) {
  const accepts = getAccepts(request)
  const accepted = accepts.find((accept) =>
    mediaTypes.includes(accept.mediaType as T),
  ) as Accept<T>
  return accepted || null
}
