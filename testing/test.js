import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 50, // number of virtual users
  duration: '30s', // test duration
};

export default function () {
  http.get('https://your-api-url.com/api/test');
  sleep(1);
}