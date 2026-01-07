import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import * as recordingsRoutes from './routes/recordings.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Enable storage for file uploads
app.withStorage();

// Export App type for use in route files
export type App = typeof app;

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
recordingsRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
