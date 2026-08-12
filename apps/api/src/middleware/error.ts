import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }

  // Log the detail, return none — internal errors must not leak to clients.
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
