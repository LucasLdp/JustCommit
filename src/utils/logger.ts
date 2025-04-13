import chalk from "chalk";

export function patchConsole() {
  const log = console.log;
  const warn = console.warn;
  const error = console.error;
  const info = console.info;

  console.log = (...args: any[]) => {
    log(chalk.white("📤  " + args.join(" ")));
  };

  console.info = (...args: any[]) => {
    info(chalk.blue("📝  " + args.join(" ")));
  };

  console.warn = (...args: any[]) => {
    warn(chalk.yellow("⚠️  " + args.join(" ")));
  };

  console.error = (...args: any[]) => {
    error(chalk.red("❌  " + args.join(" ")));
  };
}
