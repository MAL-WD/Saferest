const Redis = require('ioredis');

async function fixEviction() {
  const url = 'redis://default:8cZjjIBVJ9wXQ7eImGL3dahomTqSgaOq@redis-10262.c339.eu-west-3-1.ec2.cloud.redislabs.com:10262';
  try {
    const redis = new Redis(url);
    redis.on('connect', () => console.log('Connected to Redis'));
    redis.on('error', (err) => console.log('Redis Error:', err));
    
    await redis.config('SET', 'maxmemory-policy', 'noeviction');
    console.log('Successfully set maxmemory-policy to noeviction');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixEviction();
