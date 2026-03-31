const {createClient} = require('redis');
require('dotenv').config();

const redisClient = createClient({
    username: 'default',
    password: process.env.redis_pass,
    socket: {
        host: 'redis-17312.c257.us-east-1-3.ec2.cloud.redislabs.com',
        port: 17312,
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
