const {createClient} = require('redis');
require('dotenv').config();

const redisClient = createClient({
    username: 'default',
    password: process.env.redis_pass,
    socket: {
        host: process.env.REDIS_HOST ,
        port: process.env.REDIS_PORT,
        reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});

redisClient.on('reconnecting', () => {
    console.warn('Redis reconnecting...');
});

redisClient.on('connect', () => {
    console.log('Redis connected.');
});



module.exports = redisClient;
