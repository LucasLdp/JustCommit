import { ApiKeyService, GitService } from "@/services";
import { Command } from "commander";

export const commitCommand = new Command("commit")
  .description("Create a conventional commit based on staged changes")
  .option("-d, --dry-run", "Generate commit message without committing")
  .action(async (options) => {
    try {
      const gitService = new GitService();

      const diff = gitService.getGitDiff();
      if (!diff) return;

      const commitMessage = await gitService.generateConventionalCommit(diff);

      if (!commitMessage) return;

      if (options.dryRun) {
        console.log(commitMessage);
      } else {
        gitService.createCommit(commitMessage);
      }
    } catch (error) {
      console.error(error);
    }
  });
