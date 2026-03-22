import type { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(err)

  if (err.name === 'ZodError') {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: JSON.parse(err.message),
        },
      },
      400
    )
  }

  const status = 'status' in err ? (err.status as number) : 500

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: status === 500 ? 'Internal server error' : err.message,
      },
    },
    status as 400 | 401 | 403 | 404 | 409 | 422 | 500
  )
}
