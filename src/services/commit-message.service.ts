import { execSync } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiKeyService } from "./api-key.service";

class GitService {
  private apiKey: string;
  private apiKeyService: ApiKeyService;

  constructor() {
    this.apiKeyService = new ApiKeyService();
    this.apiKey = ""; // Inicializando a chave como vazia
  }

  public async initialize(): Promise<void> {
    this.apiKey = this.apiKeyService.loadApiKey();
  }

  private runSafe(cmd: string): string {
    try {
      return execSync(cmd, { stdio: ["pipe", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      return "";
    }
  }

  public getGitDiff(): string {
    const stagedFiles = this.runSafe("git diff --cached --name-only");
    if (!stagedFiles) {
      console.warn(
        "Nenhuma alteração staged encontrada. Use 'git add' primeiro."
      );
      return "";
    }
    return this.runSafe("git diff --cached");
  }

  public getLastCommits(count = 1): string {
    return this.runSafe(`git log -${count} --pretty=format:"%h %s" --stat`);
  }

  public getCommitDetails(sha: string): string {
    return this.runSafe(`git show ${sha}`);
  }

  public async generateConventionalCommit(
    content: string
  ): Promise<string | null> {
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Based on the following git changes, create a conventional commit message.
        Follow the format: <type>(<optional scope>): <description>
        Types include:
        - feat: A new feature
        - fix: A bug fix
        - docs: Documentation changes
        - style: Changes that don't affect code behavior (formatting, etc.)
        - refactor: Code changes that neither fix bugs nor add features
        - perf: Performance improvements
        - test: Adding or modifying tests
        - chore: Changes to build process or auxiliary tools
        Make the description concise but descriptive.
        Only return the commit message, nothing else.
        Changes:
        ${content}
      `;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("Failed to generate commit message:", error);
      return null;
    }
  }

  public createCommit(message: string): void {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    console.log(`Commit created: ${message}`);
  }

  public amendLastCommit(message: string): void {
    execSync(`git commit --amend -m "${message.replace(/"/g, '\\"')}"`);
    console.log(`Commit amended: ${message}`);
  }
}

export { GitService };
