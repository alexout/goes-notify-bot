// helpers.ts

export function getEnvVariableValueOrExit(variableName: string): string {
    const value = process.env[variableName];
    
    if (!value) {
      console.error(`Environment variable ${variableName} is not defined.`);
      process.exit(2);
    }
  
    return value;
}
  