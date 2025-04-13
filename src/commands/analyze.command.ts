import { Command } from "commander";
import { GitService } from "../services";

export const analyzeCommand = new Command("analyze")
  .description("Analyze a specific commit by SHA")
  .argument("<commit-sha>", "The SHA of the commit to analyze")
  .action(async (commitSha) => {
    try {
      const gitService = new GitService();
      const commitDetails = gitService.getCommitDetails(commitSha);
      const conventionalCommit = await gitService.generateConventionalCommit(
        commitDetails
      );

      console.log("Original commit:");
      console.log(commitDetails.split("\n")[0]);
      console.log("\nSuggested conventional commit:");
      console.log(conventionalCommit);
    } catch (error) {
      console.error("Failed to analyze commit:", error);
    }
  });
