const missingEnvMessage = (key: string) => `Missing required environment variable: ${key}`;

export function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(missingEnvMessage(key));
  }

  return value;
}
