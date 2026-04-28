# Roteiro de Evidências — Checklist de Screenshots e Comandos

Siga este roteiro na ordem indicada. Para cada item: execute o comando exato,
tire o screenshot do terminal/browser e anote o resultado.

---

## BLOCO 1 — Docker

### 1.1 Build da imagem

```powershell
cd "C:\Users\user\Desktop\ecommerce-microservices\arquitetura_de_microsservicos\ecommerce-microservices"
docker build -f services/user-service/Dockerfile -t danimoreira5150/user-service:latest .
```

**Screenshot**: Terminal mostrando os 3 stages (`deps`, `builder`, `runner`) e `Successfully built`.

---

### 1.2 Push para Docker Hub

```powershell
docker push danimoreira5150/user-service:latest
```

**Screenshot**: Terminal mostrando as layers sendo enviadas e `latest: digest: sha256:...`.

---

### 1.3 Imagem no Docker Hub

Acesse: https://hub.docker.com/r/danimoreira5150/user-service

**Screenshot**: Página do repositório mostrando a tag `latest` e a data de push.

---

### 1.4 docker-compose up

```powershell
docker compose up -d
docker compose ps
```

**Screenshot**: Tabela mostrando `userservice-app`, `userservice-postgres`, `userservice-redis` com status `healthy`.

---

### 1.5 Bind mount funcionando

```powershell
docker inspect userservice-app --format '{{json .Mounts}}' | python -m json.tool
```

**Screenshot**: JSON mostrando o bind mount com `"Type":"bind"` e o caminho `services/user-service/src`.

---

### 1.6 Named volume do PostgreSQL

```powershell
docker volume inspect ecommerce-microservices_postgres_data
```

**Screenshot**: JSON mostrando `"Driver":"local"` e o mountpoint no host.

---

### 1.7 Health check via curl

```powershell
curl -s http://localhost:3001/health/live
curl -s http://localhost:3001/health/ready
curl -s http://localhost:3001/metrics | head -20
```

**Screenshot**: Respostas JSON das rotas de saúde e primeiras linhas das métricas Prometheus.

---

## BLOCO 2 — Kubernetes

### 2.1 Iniciar minikube

```powershell
minikube start --driver=docker --cpus=4 --memory=6144
```

**Screenshot**: Terminal mostrando `Done! kubectl is now configured to use "minikube"`.

---

### 2.2 Aplicar manifests

```powershell
kubectl apply -k k8s/overlays/local
```

**Screenshot**: Terminal listando os recursos criados (`namespace/ecommerce created`, `deployment/user-service created`, etc.).

---

### 2.3 Status do cluster

```powershell
kubectl get all -n ecommerce
```

**Screenshot**: Tabela mostrando 4 pods `user-service-*` com status `Running`, Services, Deployment e ReplicaSet.

---

### 2.4 Pods em detalhe

```powershell
kubectl get pods -n ecommerce -o wide
```

**Screenshot**: Tabela com os 4 pods, IPs e nó.

---

### 2.5 PVC Bound

```powershell
kubectl get pvc -n ecommerce
```

**Screenshot**: Linha `postgres-pvc` com STATUS `Bound` e CAPACITY `5Gi`.

---

### 2.6 Logs de um pod

```powershell
kubectl logs -l app=user-service -n ecommerce --tail=20
```

**Screenshot**: Log mostrando `User service listening on port 3000`.

---

### 2.7 Acesso via NodePort

```powershell
$IP = minikube ip
curl -s "http://${IP}:30001/health/live"
curl -s "http://${IP}:30001/health/ready"
```

**Screenshot**: Respostas `{"status":"ok"}` e `{"status":"ok","checks":{"db":"ok"}}`.

---

## BLOCO 3 — Observabilidade

### 3.1 Instalar kube-prometheus-stack

```powershell
helm upgrade --install kube-prometheus-stack `
  prometheus-community/kube-prometheus-stack `
  --namespace monitoring --create-namespace `
  -f observability/helm/kube-prometheus-stack-values.yaml
```

**Screenshot**: Terminal com `Release "kube-prometheus-stack" has been deployed successfully!`.

---

### 3.2 Status do monitoring

```powershell
kubectl get all -n monitoring
kubectl get pvc -n monitoring
```

**Screenshot 1**: Todos os pods `Running` no namespace monitoring.
**Screenshot 2**: PVCs com STATUS `Bound`.

---

### 3.3 Prometheus ClusterIP

```powershell
kubectl get svc -n monitoring | findstr prometheus
```

**Screenshot**: Linha do Prometheus com TYPE `ClusterIP`.

---

### 3.4 Grafana acessível

```powershell
$IP = minikube ip
Start-Process "http://${IP}:30300"
```

**Screenshot**: Tela de login do Grafana no browser. Login: admin / admin123.

---

### 3.5 Dashboard importado

No Grafana: **Dashboards → Import → Upload JSON**
Selecione: `observability/grafana/dashboards/user-service.json`

**Screenshot**: Dashboard "User Service — Observabilidade" com os 7 painéis visíveis.

---

### 3.6 ServiceMonitor ativo

```powershell
kubectl get servicemonitor -n ecommerce
```

**Screenshot**: `user-service-monitor` listado.

---

## BLOCO 4 — Jenkins

### 4.1 Jenkins rodando

```powershell
docker run -d --name jenkins --restart=unless-stopped `
  -p 8080:8080 -p 50000:50000 `
  -v jenkins_home:/var/jenkins_home `
  -v /var/run/docker.sock:/var/run/docker.sock `
  jenkins/jenkins:lts-jdk17
```

**Screenshot**: Terminal com o container ID e `docker ps` mostrando `jenkins` em `Up`.

---

### 4.2 Senha inicial

```powershell
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

**Screenshot**: Terminal mostrando a senha de 32 caracteres.

---

### 4.3 Jenkins UI

Acesse: http://localhost:8080

**Screenshot**: Tela de desbloqueio do Jenkins com o campo de senha.

---

### 4.4 Pipeline executado (opcional)

Após configurar credenciais e pipeline:

**Screenshot**: Tela do pipeline `user-service-pipeline` com todos os 5 stages verdes (Checkout, Docker Build, Docker Push, K8s Deploy, Smoke Test).

---

## BLOCO 5 — Stress Test

### 5.1 Instalar k6 (se necessário)

```powershell
winget install k6
```

---

### 5.2 Executar o teste k6

```powershell
$IP = minikube ip
k6 run -e "BASE_URL=http://${IP}:30001" stress/k6/loadtest.js
```

**Screenshot 1 (durante o teste)**: Terminal mostrando VUs = 100 e requisições ativas.

**Screenshot 2 (ao final)**: Resumo do k6 mostrando:
- `http_req_duration`: valor de P95
- `error_rate`: percentual de erros
- Status dos thresholds (verde = passou)

---

### 5.3 Screenshot do Grafana durante o teste

**MOMENTO EXATO**: Quando o terminal do k6 mostrar `VUs: 100` (aproximadamente 3 minutos após o início).

**O que capturar no Grafana**:
1. Painel "Requisições por Segundo" — mostrando o pico de tráfego
2. Painel "Latência P99" — mostrando a latência durante a carga máxima
3. Painel "Pods Rodando" — confirmando as 4 réplicas ativas
4. Painel "Taxa de Erros" — confirmando < 5%

**Procedimento**:
```powershell
# Terminal 1: execute o k6
k6 run -e "BASE_URL=http://$(minikube ip):30001" stress/k6/loadtest.js

# Ao ver VUs=100 no terminal, vá ao browser e capture o Grafana
# URL: http://$(minikube ip):30300/d/user-service-dashboard-v1
```

---

## BLOCO 6 — Validações Finais

### 6.1 make k8s_status

```powershell
make k8s_status
```

**Screenshot**: Saída completa com todos os recursos.

---

### 6.2 Imagem no Docker Hub

```powershell
docker pull danimoreira5150/user-service:latest
docker inspect danimoreira5150/user-service:latest --format '{{.Config.User}}'
```

**Screenshot**: Usuário `appuser` — confirma que a imagem roda sem root.

---

## Checklist Final

- [ ] Screenshot 1.1 — Build multi-stage com 3 stages
- [ ] Screenshot 1.2 — Push para Docker Hub
- [ ] Screenshot 1.3 — Repositório no Docker Hub
- [ ] Screenshot 1.4 — docker compose ps com status healthy
- [ ] Screenshot 1.5 — Bind mount no inspect
- [ ] Screenshot 1.6 — Named volume do postgres
- [ ] Screenshot 1.7 — /health/live, /health/ready e /metrics
- [ ] Screenshot 2.1 — minikube start
- [ ] Screenshot 2.2 — kubectl apply -k
- [ ] Screenshot 2.3 — kubectl get all (4 pods Running)
- [ ] Screenshot 2.4 — kubectl get pods -o wide
- [ ] Screenshot 2.5 — PVC Bound
- [ ] Screenshot 2.6 — Logs do pod
- [ ] Screenshot 2.7 — curl via NodePort 30001
- [ ] Screenshot 3.1 — Helm install kube-prometheus-stack
- [ ] Screenshot 3.2 — monitoring namespace (pods + PVCs)
- [ ] Screenshot 3.3 — Prometheus ClusterIP
- [ ] Screenshot 3.4 — Grafana login
- [ ] Screenshot 3.5 — Dashboard importado com painéis
- [ ] Screenshot 3.6 — ServiceMonitor listado
- [ ] Screenshot 4.1 — Jenkins container rodando
- [ ] Screenshot 4.2 — Senha inicial do Jenkins
- [ ] Screenshot 4.3 — Jenkins UI
- [ ] Screenshot 5.1 — k6 com VUs=100
- [ ] Screenshot 5.2 — Resumo k6 com thresholds
- [ ] Screenshot 5.3 — Grafana durante o stress test
- [ ] Screenshot 6.1 — make k8s_status
- [ ] Screenshot 6.2 — Imagem não-root
