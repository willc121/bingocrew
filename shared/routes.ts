import { z } from 'zod';
import { insertGroupSchema, insertPersonalCardSchema } from './schema';

// Reuse error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups',
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups',
      input: insertGroupSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/groups/join',
      input: z.object({ code: z.string() }),
      responses: {
        200: z.object({ groupId: z.string() }),
        404: errorSchemas.notFound,
        400: z.object({ message: z.string() }),
      },
    },
    createInvite: {
      method: 'POST' as const,
      path: '/api/groups/:id/invites',
      responses: {
        201: z.object({ code: z.string(), expiresAt: z.string().nullable() }),
        403: errorSchemas.unauthorized,
      },
    },
    leave: {
      method: 'POST' as const,
      path: '/api/groups/:id/leave',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/groups/:id',
      input: z.object({ name: z.string().optional(), emoji: z.string().optional(), cardType: z.enum(["shared", "individual"]).optional() }),
      responses: {
        200: z.any(),
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/groups/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    linkCard: {
      method: 'POST' as const,
      path: '/api/groups/:id/link-card',
      input: z.object({ cardId: z.string() }),
      responses: {
        200: z.any(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  // Personal cards (solo mode)
  myCards: {
    list: {
      method: 'GET' as const,
      path: '/api/my-cards',
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/my-cards',
      input: insertPersonalCardSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/my-cards/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/my-cards/:id',
      input: insertPersonalCardSchema.partial(),
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/my-cards/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/my-cards/:id/progress',
      input: z.object({ squareIndex: z.number().min(0).max(24), completed: z.boolean() }),
      responses: {
        200: z.any(),
      },
    },
    trash: {
      method: 'GET' as const,
      path: '/api/my-cards/trash',
      responses: {
        200: z.array(z.any()),
      },
    },
    restore: {
      method: 'POST' as const,
      path: '/api/my-cards/:id/restore',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    permanentDelete: {
      method: 'DELETE' as const,
      path: '/api/my-cards/:id/permanent',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  // Group card endpoints
  card: {
    update: {
      method: 'PUT' as const,
      path: '/api/groups/:id/card',
      input: z.object({
        title: z.string(),
        items: z.array(z.object({ id: z.string(), text: z.string(), category: z.string().optional() })).length(25)
      }),
      responses: {
        200: z.any(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  progress: {
    toggle: {
      method: 'POST' as const,
      path: '/api/groups/:id/progress',
      input: z.object({ squareIndex: z.number().min(0).max(24), completed: z.boolean() }),
      responses: {
        200: z.any(),
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(z.any()),
      },
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/notifications/:id/read',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
