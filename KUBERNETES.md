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
git clone https://github.com/dpuiu/CHESS_WEB.git
cd CHESS_WEB/deploy/
```

## Start Services

```bash
kubectl apply -f k8s2.mysql.yaml 
kubectl apply -f k8s2.public.yaml 
kubectl apply -f k8s2.ingress.yaml
```

## Check Services

* The **pods** should be listed as **Running**, **ingress** have **ADDRESS** ...

Example: 
```bash
  kubectl get pods,services,endpoints,ingresses -n chess-web
  NAME                          READY   STATUS    RESTARTS   AGE
  pod/mysql-7b889d8bb4-k8nmj    1/1     Running   0          4m41s
  pod/public-5c8f66d6bf-ncbkc   1/1     Running   0          4m32s

  NAME             TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
  service/mysql    ClusterIP   10.102.115.162   <none>        3306/TCP   4m41s
  service/public   ClusterIP   10.109.5.6       <none>        80/TCP     4m32s

  NAME               ENDPOINTS             AGE
  endpoints/mysql    192.168.44.189:3306   4m41s
  endpoints/public   192.168.44.165:5000   4m32s

  NAME                              CLASS   HOSTS                     ADDRESS         PORTS   AGE
  ingress.networking.k8s.io/nginx   nginx   dev.sites.idies.jhu.edu   10.109.15.250   80      4m26s
```

## Forward Port

```bash
kubectl port-forward service/public 5000:80
```

## Connect to the Public Website

Web interface on local machine:

```
http://localhost:5000/chess_app/			# port forward
https://dev.sites.idies.jhu.edu/chess_app/		# dev.sites.idies.jhu.edu
```

NOTE: If you get redirected after restarting the app, you may need to wait a few minutes and try again

## Stop Services

```bash
kubectl delete -f k8s2.mysql.yaml
kubectl delete -f k8s2.public.yaml
kubectl delete ingress nginx
```

# FILES

* Service + Deployment

```bash
k8s2.mysql.yaml                  # Mysql 8.0 image + CHESS_DB database
k8s2.public.yaml                 # Public frontend + backend + CHESS_DB data files
k8s2.ingress.yaml                # Ingress config
```

# SERVICES

* `mysql`
* `public`

# VOLUMES

* none
* using /tmp/ instead
