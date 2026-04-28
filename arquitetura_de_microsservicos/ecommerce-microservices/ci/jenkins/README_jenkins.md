# Jenkins — Guia de Configuração e Uso

## Visão Geral

Este documento descreve como subir e configurar o Jenkins para executar o pipeline CI/CD do `user-service`.

## Pré-requisitos

- Docker Desktop rodando
- minikube em execução (`minikube status`)
- Acesso ao Docker Hub com conta `danimoreira5150`

---

## 1. Subindo o Jenkins via Docker

Execute o comando abaixo no PowerShell ou terminal:

```powershell
docker run -d `
  --name jenkins `
  --restart=unless-stopped `
  -p 8080:8080 `
  -p 50000:50000 `
  -v jenkins_home:/var/jenkins_home `
  -v /var/run/docker.sock:/var/run/docker.sock `
  jenkins/jenkins:lts-jdk17
```

> O volume `jenkins_home` persiste as configurações entre restarts.
> O socket Docker permite que o Jenkins execute comandos `docker` no host.

---

## 2. Obtendo a Senha Inicial

```powershell
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Acesse: **http://localhost:8080** e cole a senha exibida.

---

## 3. Instalação de Plugins

Na tela de boas-vindas, escolha **"Install suggested plugins"**.

Plugins adicionais necessários (instale em **Manage Jenkins > Plugins**):

| Plugin | Finalidade |
|--------|-----------|
| Docker Pipeline | Executar builds Docker no pipeline |
| Kubernetes CLI | Aplicar manifests K8s via `kubectl` |
| Credentials Binding | Injetar segredos como variáveis de ambiente |
| Git | Checkout do repositório |

---

## 4. Credenciais Necessárias

Acesse **Manage Jenkins > Credentials > Global > Add Credentials**:

### 4.1 Docker Hub

| Campo | Valor |
|-------|-------|
| Kind | Username with password |
| ID | `dockerhub-credentials` |
| Username | `danimoreira5150` |
| Password | Sua senha do Docker Hub |

### 4.2 kubeconfig do minikube

```powershell
# Obtenha o conteúdo do kubeconfig
cat $HOME\.kube\config
```

| Campo | Valor |
|-------|-------|
| Kind | Secret file |
| ID | `kubeconfig-minikube` |
| File | Cole o conteúdo do arquivo acima |

---

## 5. Criando o Pipeline

1. Acesse **New Item**
2. Nome: `user-service-pipeline`
3. Tipo: **Pipeline**
4. Em **Pipeline Definition**: selecione **Pipeline script from SCM**
5. SCM: **Git**
6. Repository URL: caminho local ou URL do repositório
7. Script Path: `arquitetura_de_microsservicos/ecommerce-microservices/Jenkinsfile`
8. Clique em **Save**

---

## 6. Executando o Pipeline

1. Clique em **Build Now** na página do pipeline
2. Acompanhe em **Console Output**

### Stages do Pipeline

```
Checkout → Docker Build → Docker Push → K8s Deploy → Smoke Test
```

| Stage | O que faz |
|-------|-----------|
| **Checkout** | Clona o repositório e exibe últimos commits |
| **Docker Build** | Build multi-stage da imagem `danimoreira5150/user-service` |
| **Docker Push** | Faz push das tags `:latest` e `:<build_number>` |
| **K8s Deploy** | Aplica manifests e aguarda rollout com timeout de 120s |
| **Smoke Test** | Verifica `/health/live` e `/health/ready` via NodePort 30001 |

---

## 7. Comandos Úteis

```powershell
# Ver logs do Jenkins
docker logs jenkins -f

# Reiniciar Jenkins
docker restart jenkins

# Parar Jenkins
docker stop jenkins

# Ver senha inicial novamente
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

---

## 8. Acessos

| Serviço | URL |
|---------|-----|
| Jenkins | http://localhost:8080 |
| user-service (minikube) | http://$(minikube ip):30001 |
| Grafana | http://$(minikube ip):30300 |
