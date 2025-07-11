import type { ICommand, IUnsignedCommand } from '@kadena/types';

const browserPrompt = async (command: string): Promise<string> => {
  await window.navigator.clipboard.writeText(command);
  return (
    window.prompt(
      `Command copied to clipboard.\n\n${command}\n\nEnter Signature:`,
    ) ?? ''
  );
};

// const nodePrompt = async (command: string): Promise<string> => {
//   const readline = await import('node:readline');
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   return new Promise<string>((resolve) => {
//     rl.question(`Command:\n${command}\nEnter Signature:\n`, (answer) => {
//       resolve(answer);
//       rl.close();
//     });
//   });
// };

export function createRequestToSign() {
  return async (command: IUnsignedCommand): Promise<ICommand> => {
    let sig = await browserPrompt(JSON.stringify(command, null, 2));
    console.log(sig)
    return {
      ...command,
      sigs: [{ sig }],
    } as ICommand;
  };
} 