#!/usr/bin/env node

import { Command } from "commander";
import {
  commitCommand,
  analyzeCommand,
  setupCommand,
  fixCommand,
} from "./commands";
import { patchConsole } from "./utils/logger";

patchConsole();

const program = new Command();

program.version("1.0.0").description("AI commit tool");

program.addCommand(setupCommand);
program.addCommand(commitCommand);
program.addCommand(analyzeCommand);
program.addCommand(fixCommand);

program.parse(process.argv);
