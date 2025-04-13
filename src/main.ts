#!/usr/bin/env node

import { Command } from "commander";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";
import os from "os";
import readline from "readline";
import { GoogleGenerativeAI } from "@google/generative-ai";
import chalk from "chalk";

const CONFIG_FILE = path.join(os.homedir(), "gemini-commit-config.json");

const program = new Command();

program
  .version("1.0.0")
  .description("AI commit tool")
  .option("-s, --setup", "Setup Gemini API key")
  .option(
    "-c, --commit",
    "Create a conventional commit based on staged changes"
  )
  .option("-a, --analyze <commit-sha>", "Analyze a specific commit by SHA")
  .option("-l, --last <count>", "Analyze last N commits", "1")
  .option("-f, --fix", "Fix the last commit message with conventional format")
  .option("-d, --dry-run", "Generate commit message without committing");

/**
 * Save the API key to a file
 * @param apiKey The API key to save
 * @returns void
 */
async function saveApiKey(apiKey: string) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify({ apiKey }), "utf8");
    console.log("API key saved successfully!");
  } catch (error) {
    console.error("Failed to save API key:", error);
    process.exit(1);
  }
}

async function loadApiKey() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf8");
    const config = JSON.parse(data);
    return config.apiKey;
  } catch (error) {
    console.error(
      "Failed to load API key. Please set up the API key first using --setup"
    );
    process.exit(1);
  }
}

async function promptForApiKey(): Promise<string> {
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

function runSafe(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ["pipe", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function getGitDiff() {
  const stagedFiles = runSafe("git diff --cached --name-only");

  if (!stagedFiles) {
    console.log(
      chalk.yellow(
        "⚠️ Nenhuma alteração staged encontrada. Use 'git add' primeiro."
      )
    );
    return "";
  }

  return runSafe("git diff --cached");
}

function getLastCommits(count = 1) {
  const lastCommits = runSafe(
    `git log -${count} --pretty=format:"%h %s" --stat`
  );
  if (!lastCommits) {
    console.log(chalk.yellow("⚠️ Não foi possível obter os commits."));
  }
  return lastCommits;
}

function getCommitDetails(sha: string) {
  const commitDetails = runSafe(`git show ${sha}`);
  if (!commitDetails) {
    console.log(
      chalk.yellow(`⚠️ Não foi possível obter os detalhes do commit ${sha}.`)
    );
  }
  return commitDetails;
}

async function generateConventionalCommit(content: string, apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
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
    const text = result.response.text();
    return text.trim();
  } catch (error: unknown | any) {
    console.error("Failed to generate commit message:", error);
    return null;
  }
}

function createCommit(message: string) {
  try {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    console.log(`Commit created: ${message}`);
  } catch (error: unknown | any) {
    console.error("Failed to create commit:", error.message);
  }
}

function amendLastCommit(message: string) {
  try {
    execSync(`git commit --amend -m "${message.replace(/"/g, '\\"')}"`);
    console.log(`Commit amended: ${message}`);
  } catch (error: unknown | any) {
    console.error("Failed to amend commit:", error.message);
  }
}

async function main() {
  program.parse(process.argv);
  const options = program.opts();

  if (Object.keys(options).length === 0) {
    program.help();
  }

  if (options.setup) {
    const apiKey = await promptForApiKey();
    await saveApiKey(apiKey);
    return;
  }

  // All other commands require the API key
  const apiKey = await loadApiKey();

  if (options.commit) {
    const diff = getGitDiff();
    if (!diff) {
      console.log(
        chalk.yellow(
          "⚠️ Nenhuma alteração staged encontrada. Use 'git add' primeiro."
        )
      );
      return;
    }

    const commitMessage = await generateConventionalCommit(diff, apiKey);

    if (!commitMessage) {
      console.error("Failed to generate commit message");
      return;
    }

    if (options.dryRun) {
      console.log("Generated commit message (dry run):");
      console.log(commitMessage);
    } else {
      createCommit(commitMessage);
    }
  }

  if (options.analyze) {
    const commitDetails = getCommitDetails(options.analyze);
    const conventionalCommit = await generateConventionalCommit(
      commitDetails,
      apiKey
    );
    console.log("Original commit:");
    console.log(commitDetails.split("\n")[0]);
    console.log("\nSuggested conventional commit:");
    console.log(conventionalCommit);
  }

  if (options.last) {
    const count = parseInt(options.last);
    const lastCommits = getLastCommits(count);
    console.log("Analyzing last commits...");
    console.log(lastCommits);
    const conventionalCommit = await generateConventionalCommit(
      lastCommits,
      apiKey
    );
    console.log("\nSuggested conventional commit format:");
    console.log(conventionalCommit);
  }

  if (options.fix) {
    const lastCommit = getLastCommits(1);
    const conventionalCommit = await generateConventionalCommit(
      lastCommit,
      apiKey
    );

    if (!conventionalCommit) {
      console.error("Failed to generate conventional commit message");
      return;
    }

    if (options.dryRun) {
      console.log("Would amend last commit to:");
      console.log(conventionalCommit);
    } else {
      amendLastCommit(conventionalCommit);
    }
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
