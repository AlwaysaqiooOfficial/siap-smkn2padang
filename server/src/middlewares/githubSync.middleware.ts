import type { RequestHandler } from "express";
import { scheduleGitHubSync } from "../services/githubDataSync";

export const githubSyncMiddleware: RequestHandler = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) scheduleGitHubSync();
  });

  next();
};