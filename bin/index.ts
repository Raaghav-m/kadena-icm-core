#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { fileURLToPath } from "url";

// Required to emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACT_TEMPLATES = [
  {
    name: "Simple Todo - Task management system",
    value: "simple-todo",
    description: "Add, complete, and track tasks for users",
  },
  {
    name: "Simple Vote - Voting/poll system",
    value: "simple-vote",
    description: "Create polls and allow users to vote on options",
  },
  {
    name: "Product Store - E-commerce basics",
    value: "product-store",
    description: "Manage products with inventory and purchases",
  },
];

async function init() {
  console.log("\n🚀 Welcome to Create Kadena App!\n");

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "folder",
      message: "Enter your project name:",
      default: "kadena-project",
    },
    {
      type: "list",
      name: "contract",
      message: "Choose a starter contract:",
      choices: CONTRACT_TEMPLATES.map((t) => ({
        name: t.name,
        value: t.value,
      })),
    },
  ]);

  const { folder, contract } = answers;
  const targetPath = path.resolve(process.cwd(), folder);
  const templatePath = path.resolve(__dirname, "template");
  const contractTemplatePath = path.resolve(
    __dirname,
    "../contract-templates",
    `${contract}.pact`
  );

  // Copy the template
  await fs.copy(templatePath, targetPath);

  // Copy the selected contract
  const contractDestPath = path.join(targetPath, "contracts", "contract.pact");
  await fs.copy(contractTemplatePath, contractDestPath);

  console.log(`\n✅ Project created in ${folder}`);
  console.log(`📝 Contract: ${contract}.pact\n`);
  console.log("Next steps:");
  console.log(`  cd ${folder}`);
  console.log(`  cd contracts && npm install`);
  console.log(`  npm run start-chain`);
  console.log(`  npm run dev-account`);
  console.log(`  npm run deploy -- -f ./contract.pact`);
  console.log(`\nThen in another terminal:`);
  console.log(`  cd frontend && npm install`);
  console.log(`  npm run dev\n`);
}

init();
