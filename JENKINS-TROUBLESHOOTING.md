# 🔧 Jenkins Troubleshooting Guide

## 🚨 **Problem: Jenkins Master Not Responding**

Your Jenkins master at `http://100.105.57.78:8080` is not responding, which is preventing the cluster from joining properly.

## 🔍 **Root Causes**

### 1. **Jenkins Service Issues**
- Jenkins process may have crashed or hung
- Port 8080 might be blocked by firewall
- Memory/CPU exhaustion on Jenkins master
- Network connectivity issues between Jenkins and cluster

### 2. **Cluster Connectivity Issues**
- Kubernetes cluster networking problems
- Firewall blocking Jenkins from cluster
- Load balancer or service discovery issues

### 3. **Resource Exhaustion**
- Insufficient resources on Jenkins master
- Disk space full
- Too many concurrent jobs

## 🛠 **Troubleshooting Steps**

### **Step 1: Check Jenkins Status**
```bash
# Check if Jenkins is running
curl -s http://100.105.57.78:8080/api/json
curl -s http://100.105.57.78:8080

# Check Jenkins process
ps aux | grep jenkins
netstat -tlnp | grep :8080
```

### **Step 2: Check Jenkins Logs**
```bash
# View Jenkins logs
docker logs jenkins-master
kubectl logs -n jenkins -l jenkins-namespace

# Check Jenkins UI
# Access Jenkins UI at http://100.105.57.78:8080
```

### **Step 3: Check Cluster Connectivity**
```bash
# Test connectivity from Jenkins master to cluster
kubectl exec -it jenkins-master-0 -- nslookup kubernetes.default.svc.cluster.local
kubectl exec -it jenkins-master-0 -- curl -s http://kubernetes.default.svc.cluster.local

# Check network policies
kubectl get networkpolicies
kubectl describe pod jenkins-master-0
```

### **Step 4: Restart Jenkins Services**
```bash
# Restart Jenkins master
kubectl rollout restart deployment/jenkins-master

# Restart Jenkins worker
kubectl rollout restart deployment/jenkins-worker

# Scale if needed
kubectl scale deployment/jenkins-master --replicas=2
```

### **Step 5: Check System Resources**
```bash
# Check resource usage
kubectl top nodes
kubectl describe node 100.105.57.78

# Check Jenkins pod resources
kubectl describe pod jenkins-master-0
kubectl get pods -n jenkins
```

## 🚨 **Immediate Actions**

### **1. Restart Jenkins Master**
```bash
kubectl rollout restart deployment/jenkins-master
kubectl rollout status deployment/jenkins-master
```

### **2. Check Pod Status**
```bash
kubectl get pods -n jenkins -w
kubectl logs -f jenkins-master-0
```

### **3. Verify Cluster Connectivity**
```bash
# Test from different pods
kubectl exec -it jenkins-master-0 -- curl -s http://kubernetes.default.svc.cluster.local
kubectl exec -it jenkins-worker-0 -- curl -s http://kubernetes.default.svc.cluster.local
```

### **4. Manual Jenkins Restart (if needed)**
```bash
# Force restart Jenkins pod
kubectl delete pod jenkins-master-0
kubectl delete pod jenkins-worker-0

# Or restart Jenkins service on the host
ssh user@100.105.57.78 "sudo systemctl restart jenkins"
```

## 🔧 **Common Solutions**

### **Jenkins Master Issues**
- **Memory**: Increase Jenkins master memory allocation
- **CPU**: Add more CPU resources to Jenkins master
- **Storage**: Ensure sufficient disk space
- **Network**: Check firewall rules on port 8080

### **Cluster Issues**
- **Network**: Check CNI configuration
- **DNS**: Verify DNS resolution for Jenkins
- **Firewall**: Ensure cluster allows Jenkins communication
- **Load Balancer**: Check if external IP is accessible

### **Configuration Fixes**
```yaml
# Example: Add resource limits to Jenkins deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jenkins-master
spec:
  template:
    spec:
      containers:
      - name: jenkins
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## 📞 **Monitoring Commands**

### **Real-time Monitoring**
```bash
# Watch Jenkins pod status
watch kubectl get pods -n jenkins

# Monitor Jenkins logs
kubectl logs -f jenkins-master-0 --tail=100

# Check cluster events
kubectl get events -n jenkins --sort-by='.lastTimestamp'
```

## 🆘 **Emergency Recovery**

### **If Jenkins is Completely Down**
```bash
# Scale down Jenkins temporarily
kubectl scale deployment jenkins-master --replicas=0

# Deploy new Jenkins master
kubectl apply -f jenkins-emergency.yaml

# Scale back up when fixed
kubectl scale deployment jenkins-master --replicas=1
```

## 📋 **Prevention Measures**

### **1. Resource Monitoring**
```bash
# Set up alerts for Jenkins resource usage
kubectl top nodes --watch
```

### **2. Health Checks**
```bash
# Add Jenkins health check endpoint
curl -f http://100.105.57.78:8080/health
```

### **3. Backup Configuration**
```yaml
# Jenkins backup configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: jenkins-backup
data:
  backup-enabled: "true"
  backup-schedule: "0 2 * * *"
```

## 🎯 **Next Steps**

1. **Immediate**: Check Jenkins master status using the commands above
2. **Diagnose**: Use the troubleshooting steps to identify the root cause
3. **Fix**: Apply the appropriate solution based on your findings
4. **Monitor**: Keep watching the Jenkins logs and cluster status
5. **Prevent**: Set up monitoring and alerts to prevent future issues

## 📞 **Support**

If the issue persists after trying these steps:
1. **Check system resources** on the Jenkins master node
2. **Review cluster logs** for any networking issues
3. **Consider external Jenkins** service if the master continues to fail
4. **Contact your cluster administrator** for networking issues

This troubleshooting guide should help you quickly identify and resolve the Jenkins connectivity issue! 🚀
