DOCKER_USER   := danimoreira5150
IMAGE_NAME    := $(DOCKER_USER)/user-service
IMAGE_TAG     := latest
NAMESPACE     := ecommerce
MINIKUBE_IP   := $(shell minikube ip 2>/dev/null || echo "127.0.0.1")

.PHONY: docker_build docker_push minikube_up k8s_apply k8s_status \
        obs_install obs_status grafana_url stress_k6 jenkins_up \
        jenkins_password help

## ─────────────────────────────────────────────────────────
## DOCKER
## ─────────────────────────────────────────────────────────

docker_build:
	@echo "==> Build da imagem Docker multi-stage"
	docker build -f services/user-service/Dockerfile \
		-t $(IMAGE_NAME):$(IMAGE_TAG) .
	@echo "==> Imagem: $(IMAGE_NAME):$(IMAGE_TAG)"

docker_push: docker_build
	@echo "==> Push para Docker Hub"
	docker push $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "==> Push concluido"

## ─────────────────────────────────────────────────────────
## MINIKUBE
## ─────────────────────────────────────────────────────────

minikube_up:
	@echo "==> Iniciando minikube"
	minikube start --driver=docker --cpus=4 --memory=6144
	minikube addons enable metrics-server
	@echo "==> minikube IP: $(MINIKUBE_IP)"

minikube_stop:
	minikube stop

## ─────────────────────────────────────────────────────────
## KUBERNETES
## ─────────────────────────────────────────────────────────

k8s_apply:
	@echo "==> Aplicando manifests Kubernetes"
	kubectl apply -k k8s/overlays/local
	kubectl rollout status deployment/user-service -n $(NAMESPACE) --timeout=120s
	@echo "==> Deploy concluido"

k8s_status:
	@echo "==> Status do namespace $(NAMESPACE)"
	kubectl get all -n $(NAMESPACE)
	@echo ""
	@echo "==> PVCs"
	kubectl get pvc -n $(NAMESPACE)
	@echo ""
	@echo "==> Endpoints do servico"
	kubectl get endpoints user-service -n $(NAMESPACE)

k8s_url:
	@echo "==> URL do user-service: http://$(MINIKUBE_IP):30001"
	@echo "==> Health: http://$(MINIKUBE_IP):30001/health/live"
	@echo "==> Metricas: http://$(MINIKUBE_IP):30001/metrics"

## ─────────────────────────────────────────────────────────
## OBSERVABILIDADE
## ─────────────────────────────────────────────────────────

obs_install:
	@echo "==> Instalando kube-prometheus-stack via Helm"
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
	helm repo update
	helm upgrade --install kube-prometheus-stack \
		prometheus-community/kube-prometheus-stack \
		--namespace monitoring --create-namespace \
		-f observability/helm/kube-prometheus-stack-values.yaml
	@echo "==> Stack instalada no namespace monitoring"

obs_status:
	@echo "==> Status do namespace monitoring"
	kubectl get all -n monitoring
	@echo ""
	@echo "==> PVCs de observabilidade"
	kubectl get pvc -n monitoring

grafana_url:
	@echo "==> Grafana: http://$(MINIKUBE_IP):30300"
	@echo "==> Login: admin / admin123"

prometheus_url:
	@echo "==> Prometheus (port-forward):"
	@echo "    kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring"

## ─────────────────────────────────────────────────────────
## JENKINS
## ─────────────────────────────────────────────────────────

jenkins_up:
	@echo "==> Subindo Jenkins via Docker"
	docker run -d \
		--name jenkins \
		--restart=unless-stopped \
		-p 8080:8080 \
		-p 50000:50000 \
		-v jenkins_home:/var/jenkins_home \
		-v /var/run/docker.sock:/var/run/docker.sock \
		jenkins/jenkins:lts-jdk17
	@echo "==> Aguarde ~60s e acesse: http://localhost:8080"

jenkins_password:
	@echo "==> Senha inicial do Jenkins:"
	docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

## ─────────────────────────────────────────────────────────
## STRESS TEST
## ─────────────────────────────────────────────────────────

stress_k6:
	@echo "==> Executando teste de carga com k6"
	@echo "==> Alvo: http://$(MINIKUBE_IP):30001"
	k6 run \
		-e BASE_URL=http://$(MINIKUBE_IP):30001 \
		stress/k6/loadtest.js

## ─────────────────────────────────────────────────────────
## HELP
## ─────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Targets disponíveis:"
	@echo "  docker_build     Build da imagem Docker"
	@echo "  docker_push      Build + push para Docker Hub"
	@echo "  minikube_up      Inicia minikube (driver=docker, 4 CPUs, 6GB)"
	@echo "  k8s_apply        Aplica manifests Kubernetes (kustomize)"
	@echo "  k8s_status       Status de todos os recursos no namespace"
	@echo "  obs_install      Instala kube-prometheus-stack via Helm"
	@echo "  obs_status       Status do namespace monitoring"
	@echo "  grafana_url      Exibe URL do Grafana"
	@echo "  stress_k6        Executa teste de carga k6"
	@echo "  jenkins_up       Sobe Jenkins via Docker"
	@echo "  jenkins_password Exibe senha inicial do Jenkins"
	@echo ""
