import { GitService } from "@/services";
import { Command } from "commander";

const gitService = new GitService();

export const fixCommand = new Command("fix")
  .description("Fix the last commit message with conventional format")
  .option("-d, --dry-run", "Dry run: show the amended commit message")
  .action(async (options) => {
    const lastCommit = gitService.getLastCommits(1);
    const conventionalCommit = await gitService.generateConventionalCommit(
      lastCommit
    );

    if (!conventionalCommit) {
      console.error("Failed to generate conventional commit message");
      return;
    }

    if (options.dryRun) {
      console.log("Would amend last commit to:");
      console.log(conventionalCommit);
    } else {
      gitService.amendLastCommit(conventionalCommit);
    }
  });
