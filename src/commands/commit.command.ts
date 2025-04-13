import { GitService } from "@/services";
import { Command } from "commander";
import readline from "readline";
import { execSync } from "child_process";

export const commitCommand = new Command("commit")
  .description("Create a conventional commit based on staged changes")
  .option("-d, --dry-run", "Generate commit message without committing")
  .action(async (options) => {
    try {
      const gitService = new GitService();

      let diff = gitService.getGitDiff();

      if (!diff) {
        const addFiles = await askQuestion(
          "Nenhuma alteração staged encontrada. Deseja executar 'git add .' para adicionar todos os arquivos? (y/n): "
        );

        if (addFiles) {
          console.log("Adicionando arquivos...");
          execSync("git add .");
          console.log("Arquivos adicionados com sucesso.");

          diff = gitService.getGitDiff();
        } else {
          console.log("Nenhuma ação tomada. Execute 'git add' manualmente.");
          return;
        }
      }

      const commitMessage = await gitService.generateConventionalCommit(diff);

      if (!commitMessage) {
        console.error("Falha ao gerar a mensagem de commit convencional.");
        return;
      }

      if (options.dryRun) {
        console.log(commitMessage);
      } else {
        gitService.createCommit(commitMessage);
      }
    } catch (error) {
      console.error("Erro ao tentar criar o commit:", error);
    }
  });

function askQuestion(query: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}
