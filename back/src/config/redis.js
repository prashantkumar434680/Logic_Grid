const { createClient } = require('redis');
require('dotenv').config();

const memoryBlocklist = new Map();
let isConnected = false;
let client = null;

try {
  client = createClient({
    username: 'default',
    password: process.env.redis_pass,
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      connectTimeout: 2000,
      reconnectStrategy: (retries) => {
        if (retries > 2) return false; // Stop retrying if host unreachable
        return 500;
      },
    },
  });

  client.on('error', () => {
    isConnected = false;
  });

  client.on('connect', () => {
    isConnected = true;
    console.log('Redis connected.');
  });
} catch (e) {
  console.warn('Could not initialize Redis client, using in-memory store.');
}

const safeRedisClient = {
  connect: async () => {
    if (!client) return;
    try {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 2500)
        ),
      ]);
      isConnected = true;
    } catch (err) {
      console.warn(`Redis host unavailable (${err.message}). Using resilient in-memory token blocklist.`);
      isConnected = false;
    }
  },
  exists: async (key) => {
    if (isConnected && client?.isOpen) {
      try {
        return await client.exists(key);
      } catch {
        isConnected = false;
      }
    }
    if (memoryBlocklist.has(key)) {
      const exp = memoryBlocklist.get(key);
      if (exp && exp < Date.now() / 1000) {
        memoryBlocklist.delete(key);
        return 0;
      }
      return 1;
    }
    return 0;
  },
  set: async (key, val) => {
    if (isConnected && client?.isOpen) {
      try {
        return await client.set(key, val);
      } catch {
        isConnected = false;
      }
    }
    memoryBlocklist.set(key, null);
    return 'OK';
  },
  expireAt: async (key, exp) => {
    if (isConnected && client?.isOpen) {
      try {
        return await client.expireAt(key, exp);
      } catch {
        isConnected = false;
      }
    }
    memoryBlocklist.set(key, exp);
    return 1;
  },
  on: (event, handler) => {
    if (client) client.on(event, handler);
  },
};

module.exports = safeRedisClient;
