import { ApiKeyService } from "@/services";
import { Command } from "commander";

const apiKeyService = new ApiKeyService();

export const setupCommand = new Command("setup")
  .description("Setup Gemini API key")
  .action(async () => {
    try {
      const apiKey = await apiKeyService.promptForApiKey();
      await apiKeyService.saveApiKey(apiKey);
    } catch (error) {
      console.error("Failed to setup Gemini API key:", error);
    }
  });
