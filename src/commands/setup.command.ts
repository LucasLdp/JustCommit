import inquirer from "inquirer";
import { promises as fs } from "fs";
import { Command } from "commander";
import path from "path";
import os from "os";

async function saveConfig(config: {
  apiKey: string;
  useEmojis: boolean;
}): Promise<void> {
  try {
    const configFilePath = path.join(os.homedir(), "gemini-commit-config.json");

    await fs.writeFile(configFilePath, JSON.stringify(config, null, 2), "utf8");
    console.log("Configurações salvas com sucesso!");
  } catch (error) {
    console.error("Falha ao salvar as configurações:", error);
    process.exit(1);
  }
}

export const setupCommand = new Command("setup")
  .description("Setup Gemini API key and configuration")
  .option("-s, --setup", "Setup Gemini API key and configuration")
  .action(async () => {
    try {
      const { apiKey } = await inquirer.prompt([
        {
          type: "input",
          name: "apiKey",
          message: "Por favor, insira sua chave da API Gemini:",
          validate: (input) => (input ? true : "A chave da API é obrigatória."),
        },
      ]);

      const { useEmojis } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useEmojis",
          message: "Você usa emojis nos commits?",
          default: true,
        },
      ]);

      await saveConfig({
        apiKey,
        useEmojis,
      });

      console.log(`Emojis nos commits: ${useEmojis ? "Sim" : "Não"}`);
    } catch (error) {
      console.error("Falha ao configurar:", error);
    }
  });
