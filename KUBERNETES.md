# CHESS_WEB Kubernetes Setup

**Author:** Daniela Puiu  
**Last Update:** 2026-03-23  
**Topic:** [Kubernetes](https://kubernetes.io/) setup for [CHESS_WEB](https://github.com/alevar/CHESS_WEB)  

# GOAL

* Run CHESS_WEB on Kubernetes Cluster

# SETUP

## Login into Kubectl Server

```bash
  USER=
  SERVER=
  GATEWAY=
  GATEWAY_PORT=14132
  LOCAL_PORT=9011
 
  ssh -p $GATEWAY_PORT -L $LOCAL_PORT:localhost:5000 -J $USER@$GATEWAY $USER@$SERVER
```

## Download Git Repository

```bash
git pull https://github.com/dpuiu/CHESS_WEB.git
cd CHESS_WEB/deploy/
```

## Start Services

```bash
kubectl apply -f k8s2.mysql.yaml 
kubectl apply -f k8s2.public.yaml 
```

## Check Services

* The 2 pods should be listed as **Running**

```bash
kubectl get configmaps,cronjobs,deployments,endpoints,horizontalpodautoscalers,ingresses,jobs,limitranges,persistentvolumeclaims,poddisruptionbudgets,pods,podtemplates,replicasets,replicationcontrollers,resourcequotas,rolebindings,roles,secrets,serviceaccounts,services,statefulsets -n chess-web
 
  NAME             READY   STATUS    RESTARTS   AGE
  pod/mysql-...    1/1     Running   0          7s
  pod/public-...   1/1     Running   0          7s

```

## Forward Port

```bash
kubectl port-forward service/public 5000:5000
```

## Connect to the Public Website

Web interface on local machine:

```
http://localhost:5000/chess_app/
https://dev.sites.idies.jhu.edu/chess_web/chess_app/
```

## Stop Services

```bash
kubectl delete -f k8s2.mysql.yaml
kubectl delete -f k8s2.public.yaml
```

# FILES

* Service + Deployment

```bash
k8s2.mysql.yaml                  # Mysql 8.0 image + CHESS_DB database
k8s2.public.yaml                 # Public frontend + backend + CHESS_DB data files
```

# SERVICES

* `mysql`
* `public`

# VOLUMES

* none
* using /tmp/ instead
