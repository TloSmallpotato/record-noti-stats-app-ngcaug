import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, count as dbCount } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // GET /recordings - List all recordings with pagination
  fastify.get('/recordings', {
    schema: {
      description: 'List all recordings with pagination',
      tags: ['recordings'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', description: 'Page number (1-indexed)', default: 1 },
          limit: { type: 'integer', description: 'Items per page', default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  video_url: { type: 'string' },
                  thumbnail_url: { type: 'string' },
                  duration: { type: 'integer' },
                  created_at: { type: 'string' },
                  file_size: { type: 'integer' },
                },
              },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
    const offset = (page - 1) * limit;

    const [result] = await app.db
      .select({ value: dbCount() })
      .from(schema.recordings);
    const total = result.value;

    const recordings = await app.db
      .select()
      .from(schema.recordings)
      .orderBy((t) => [t.created_at])
      .limit(limit)
      .offset(offset);

    return {
      data: recordings,
      total,
      page,
      limit,
    };
  });

  // POST /recordings - Create a new recording entry
  fastify.post('/recordings', {
    schema: {
      description: 'Create a new recording entry',
      tags: ['recordings'],
      body: {
        type: 'object',
        required: ['video_url', 'duration', 'file_size'],
        properties: {
          video_url: { type: 'string', description: 'URL to the video file' },
          thumbnail_url: { type: 'string', description: 'URL to the thumbnail (optional)' },
          duration: { type: 'integer', description: 'Video duration in seconds' },
          file_size: { type: 'integer', description: 'File size in bytes' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            video_url: { type: 'string' },
            thumbnail_url: { type: 'string' },
            duration: { type: 'integer' },
            created_at: { type: 'string' },
            file_size: { type: 'integer' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { video_url, thumbnail_url, duration, file_size } = request.body as {
      video_url: string;
      thumbnail_url?: string;
      duration: number;
      file_size: number;
    };

    const [recording] = await app.db
      .insert(schema.recordings)
      .values({
        video_url,
        thumbnail_url: thumbnail_url || null,
        duration,
        file_size,
      })
      .returning();

    reply.code(201);
    return recording;
  });

  // GET /recordings/count - Get total count of recordings
  fastify.get('/recordings/count', {
    schema: {
      description: 'Get total count of recordings',
      tags: ['recordings'],
      response: {
        200: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
          },
        },
      },
    },
  }, async () => {
    const [result] = await app.db
      .select({ value: dbCount() })
      .from(schema.recordings);

    return { count: result.value };
  });

  // DELETE /recordings/:id - Delete a recording
  fastify.delete('/recordings/:id', {
    schema: {
      description: 'Delete a recording by ID',
      tags: ['recordings'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Recording ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const [deleted] = await app.db
      .delete(schema.recordings)
      .where(eq(schema.recordings.id, id))
      .returning();

    if (!deleted) {
      reply.code(404);
      return { error: 'Recording not found' };
    }

    return { success: true, message: 'Recording deleted successfully' };
  });

  // POST /recordings/upload - Multipart file upload endpoint
  fastify.post('/recordings/upload', {
    schema: {
      description: 'Upload a video file and create a recording entry',
      tags: ['recordings'],
      consumes: ['multipart/form-data'],
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            video_url: { type: 'string' },
            thumbnail_url: { type: 'string' },
            duration: { type: 'integer' },
            created_at: { type: 'string' },
            file_size: { type: 'integer' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      reply.code(400);
      return { error: 'No file provided' };
    }

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch (err) {
      reply.code(413);
      return { error: 'File too large' };
    }

    const filename = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `videos/${Date.now()}-${filename}`;

    // Upload file to storage
    const uploadedKey = await app.storage.upload(key, buffer);

    // Get signed URL for the uploaded file
    const { url } = await app.storage.getSignedUrl(uploadedKey);

    // Create recording entry in database
    // Note: duration and thumbnail_url would need to be provided separately
    // or calculated from the video file
    const [recording] = await app.db
      .insert(schema.recordings)
      .values({
        video_url: url,
        thumbnail_url: null,
        duration: 0, // Would need to be calculated from video metadata
        file_size: buffer.length,
      })
      .returning();

    reply.code(201);
    return recording;
  });

  // POST /webhooks/github - GitHub webhook endpoint
  fastify.post('/webhooks/github', {
    schema: {
      description: 'GitHub webhook endpoint for future integration',
      tags: ['webhooks'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Placeholder for GitHub webhook implementation
    const payload = request.body;

    app.logger.info('GitHub webhook received');

    return { success: true, message: 'Webhook received' };
  });
}
