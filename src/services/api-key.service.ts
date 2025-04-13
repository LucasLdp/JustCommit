import { promises as fs, readFileSync } from "fs";
import path from "path";
import readline from "readline";
import os from "os";

class ApiKeyService {
  private configFilePath: string;

  constructor() {
    this.configFilePath = path.join(os.homedir(), "gemini-commit-config.json");
  }

  public async saveApiKey(apiKey: string): Promise<void> {
    try {
      await fs.writeFile(
        this.configFilePath,
        JSON.stringify({ apiKey }),
        "utf8"
      );
      console.log("API key saved successfully!");
    } catch (error) {
      console.error("Failed to save API key:", error);
      process.exit(1);
    }
  }

  public loadApiKey(): string {
    try {
      const data = readFileSync(this.configFilePath, "utf8");
      const config = JSON.parse(data);
      if (!config.apiKey) {
        console.error(
          "API key not found. Please set up the API key first using --setup"
        );
        process.exit(1);
      }
      return config.apiKey;
    } catch (error) {
      console.error("Failed to load API key:", error);
      process.exit(1);
    }
  }
  public async promptForApiKey(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question("Please enter your Gemini API key: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}

export { ApiKeyService };
