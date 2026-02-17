const {createClient} = require('redis');
require('dotenv').config();

const redisClient = createClient({
    username: 'default',
    password: process.env.redis_pass,
    socket: {
        host: 'redis-17312.c257.us-east-1-3.ec2.cloud.redislabs.com',
        port: 17312
    }
});

module.exports = redisClient;