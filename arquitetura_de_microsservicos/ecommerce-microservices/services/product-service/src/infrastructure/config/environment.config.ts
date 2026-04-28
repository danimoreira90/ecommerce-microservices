export function getEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

export function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  port: () => parseInt(getEnvOrDefault('PORT', '3000'), 10),
  db: {
    host: () => getEnvOrDefault('DB_HOST', 'localhost'),
    port: () => parseInt(getEnvOrDefault('DB_PORT', '5432'), 10),
    name: () => getEnvOrDefault('DB_NAME', 'product_service'),
    user: () => getEnvOrDefault('DB_USER', 'postgres'),
    password: () => getEnv('DB_PASSWORD'),
  },
  redis: {
    host: () => getEnvOrDefault('REDIS_HOST', 'localhost'),
    port: () => parseInt(getEnvOrDefault('REDIS_PORT', '6379'), 10),
  },
  kafka: {
    brokers: () => getEnvOrDefault('KAFKA_BROKERS', 'localhost:9092').split(','),
    groupId: () => getEnvOrDefault('KAFKA_GROUP_ID', 'product-service-group'),
  },
  jwt: {
    secret: () => getEnvOrDefault('JWT_SECRET', 'product-service-secret-change-me'),
  },
};
