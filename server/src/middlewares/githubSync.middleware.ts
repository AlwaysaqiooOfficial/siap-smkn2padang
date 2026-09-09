import type { RequestHandler } from "express";

export const githubSyncMiddleware: RequestHandler = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    next();
    return;
  }

  next();
};