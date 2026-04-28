import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ────────────────────────────────────────────────────────
// Métricas customizadas
// ────────────────────────────────────────────────────────
const errorRate   = new Rate('error_rate');
const loginTrend  = new Trend('login_duration_ms', true);
const healthTrend = new Trend('health_duration_ms', true);

// ────────────────────────────────────────────────────────
// Configuração do teste: ramp 0 → 10 → 50 → 100 VUs
// ────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10  },  // aquecimento
    { duration: '1m',  target: 50  },  // carga moderada
    { duration: '2m',  target: 100 },  // carga máxima
    { duration: '30s', target: 0   },  // desaquecimento
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],       // P95 < 2 s
    'error_rate':        ['rate<0.05'],        // menos de 5% de erros
    'http_req_failed':   ['rate<0.05'],
  },
};

// ────────────────────────────────────────────────────────
// URL base — use o IP do minikube obtido com: minikube ip
// Substitua MINIKUBE_IP pelo valor real antes de executar
// Exemplo: http://192.168.49.2:30001
// ────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://192.168.49.2:30001';

// ────────────────────────────────────────────────────────
// Usuário de teste (deve existir no banco)
// ────────────────────────────────────────────────────────
const TEST_EMAIL    = `k6user_${__VU}@test.com`;
const TEST_PASSWORD = 'TestPassword@123';

export function setup() {
  // Registra o usuário de teste antes do cenário principal
  const registerRes = http.post(
    `${BASE_URL}/api/v1/users/register`,
    JSON.stringify({
      email:     `setup_${Date.now()}@test.com`,
      password:  TEST_PASSWORD,
      firstName: 'K6',
      lastName:  'Test',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { setupStatus: registerRes.status };
}

export default function () {
  const params = { headers: { 'Content-Type': 'application/json' } };

  // ── 1. Health check (leve, sempre)
  const healthRes = http.get(`${BASE_URL}/health/live`);
  healthTrend.add(healthRes.timings.duration);
  const healthOk = check(healthRes, {
    'liveness status 200': (r) => r.status === 200,
  });
  errorRate.add(!healthOk);

  // ── 2. Registro de usuário único por VU
  const email = `k6vu${__VU}_${__ITER}@test.com`;
  const registerRes = http.post(
    `${BASE_URL}/api/v1/users/register`,
    JSON.stringify({
      email,
      password:  TEST_PASSWORD,
      firstName: `VU${__VU}`,
      lastName:  `ITER${__ITER}`,
    }),
    params
  );
  const registerOk = check(registerRes, {
    'register status 201': (r) => r.status === 201,
  });
  errorRate.add(!registerOk);

  sleep(0.5);

  // ── 3. Login com o usuário registrado
  const loginRes = http.post(
    `${BASE_URL}/api/v1/users/login`,
    JSON.stringify({ email, password: TEST_PASSWORD }),
    params
  );
  loginTrend.add(loginRes.timings.duration);
  const loginOk = check(loginRes, {
    'login status 200':          (r) => r.status === 200,
    'login retorna accessToken': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!loginOk);

  // ── 4. Endpoint de métricas (smoke)
  const metricsRes = http.get(`${BASE_URL}/metrics`);
  check(metricsRes, {
    'metrics status 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function teardown(data) {
  console.log(`Setup status: ${data.setupStatus}`);
}
