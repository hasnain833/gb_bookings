import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: '',
      BREVO_API_KEY: '',
      BREVO_SENDER_EMAIL: '',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      GEMINI_API_KEY: '',
    },
    include: ['src/server/tests/**/*.test.ts'],
    clearMocks: true,
  },
});
