import { promises as fs } from "fs";
import path from "path";
import os from "os";

export class ApiKeyService {
  private configFilePath: string;

  constructor() {
    this.configFilePath = path.join(os.homedir(), "gemini-commit-config.json");
  }

  public async loadConfig(): Promise<{ apiKey: string; useEmojis: boolean }> {
    try {
      await fs.access(this.configFilePath);
      const data = await fs.readFile(this.configFilePath, "utf8");
      const config = JSON.parse(data);

      if (!config.apiKey) {
        console.error(
          "Chave da API não encontrada. Execute o comando de setup."
        );
        process.exit(1);
      }

      return config;
    } catch {
      console.error(
        "Falha ao carregar as configurações ou o arquivo de configuração não existe. Execute o comando de setup primeiro."
      );
      process.exit(1);
    }
  }
}
