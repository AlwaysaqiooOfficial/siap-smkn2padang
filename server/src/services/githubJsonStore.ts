import { env } from "../config/env";

type JsonValue = Record<string, unknown> | unknown[];

type GitHubContentResponse = {
  content?: string;
  sha?: string;
};

export class GitHubJsonStore {
  private readonly apiBase = "https://api.github.com";

  private get repositoryPath() {
    return `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
  }

  private getHeaders() {
    if (!env.GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN belum dikonfigurasi");
    }

    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  private filePath(fileName: string) {
    if (!/^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.json$/i.test(fileName)) {
      throw new Error("Nama file JSON tidak valid");
    }

    if (!env.GITHUB_DATA_DIR || env.GITHUB_DATA_DIR === "." || env.GITHUB_DATA_DIR === "/") {
      return fileName;
    }

    return `${env.GITHUB_DATA_DIR}/${fileName}`;
  }

  async read<T extends JsonValue>(fileName: string, fallback: T): Promise<T> {
    const response = await fetch(
      `${this.apiBase}/repos/${this.repositoryPath}/contents/${this.filePath(fileName)}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`,
      { headers: this.getHeaders() }
    );

    if (response.status === 404) {
      return fallback;
    }

    if (!response.ok) {
      throw new Error(`GitHub gagal membaca ${fileName}: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as GitHubContentResponse;
    if (!payload.content) {
      throw new Error(`File ${fileName} di GitHub tidak memiliki isi`);
    }

    return JSON.parse(Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8")) as T;
  }

  async write<T extends JsonValue>(fileName: string, data: T, message: string) {
    const path = this.filePath(fileName);
    const currentResponse = await fetch(
      `${this.apiBase}/repos/${this.repositoryPath}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`,
      { headers: this.getHeaders() }
    );

    let sha: string | undefined;
    if (currentResponse.ok) {
      sha = ((await currentResponse.json()) as GitHubContentResponse).sha;
    } else if (currentResponse.status !== 404) {
      throw new Error(`GitHub gagal memeriksa ${fileName}: ${currentResponse.status} ${await currentResponse.text()}`);
    }

    const response = await fetch(`${this.apiBase}/repos/${this.repositoryPath}/contents/${path}`, {
      method: "PUT",
      headers: { ...this.getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        branch: env.GITHUB_BRANCH,
        content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64"),
        message,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub gagal menyimpan ${fileName}: ${response.status} ${await response.text()}`);
    }
  }
}

export const githubJsonStore = new GitHubJsonStore();