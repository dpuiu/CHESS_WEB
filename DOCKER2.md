# CHESS_WEB Web Application Setup

**Author:** Daniela Puiu  
**Last Update:** 2026-03-23  
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for [CHESS_WEB](https://github.com/alevar/CHESS_WEB)  

# GOAL

* Run CHESS_WEB on Kubernetes Cluster

# Login Kubectl server

  USER=
  SERVER=
  GATEWAY
  GATEWAY_PORT=14132
  LOCAL_PORT=9011
  ssh -p $GATEWAY_PORT -L $LOCAL_PORT:localhost:5000 -J $USER@$GATEWAY dpuiu@$SERVER

## Download Git Repository

```bash
git pull https://github.com/dpuiu/CHESS_WEB.git
cd CHESS_WEB/
```

## Start Services

```bash
kubectl apply -f k8s2.mysql.yaml 
kubectl apply -f k8s2.public.yaml 
```

## Port Forward

```bash
kubectl port-forward service/public $FLASK_PUBLIC_PORT:$FLASK_PUBLIC_PORT
```

## Connect to the Public Website

Web interface on local machine:

```
http://localhost:5000/chess_app/
```

## Stop Services

```bash
kubectl delete -f k8s2.mysql.yaml
kubectl delete -f k8s2.public.yaml
```

# Kube Files

* Service + Deployment

```bash
k8s2.mysql.yaml                  # Mysql + database
k8s2.public.yaml                 # Public frontend + backend + data files
```

# Services

* `mysql`
* `public`

# No Volumes
