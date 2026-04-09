import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  void next;

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null,
    });
    return;
  }

  if (error instanceof SyntaxError) {
    response.status(400).json({
      message: 'JSON invalido en la solicitud',
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    message: 'Error interno del servidor',
  });
}
