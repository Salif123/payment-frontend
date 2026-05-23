// API configuration using Expo Public Environment Variables
// Automatically reads EXPO_PUBLIC_API_URL during build/start
// Note: Replace the fallback IP with your actual AWS EC2 Public IP or localhost if not using env variables during native build.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_AWS_EC2_PUBLIC_IP';

console.log('Payment App Config - API URL:', API_URL);
