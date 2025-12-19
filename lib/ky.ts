import ky from 'ky';

const BASE_URL = "api/"

const http = ky.create({
  prefixUrl: BASE_URL,
  timeout: 30000, // 30 seconds
});

export default http;