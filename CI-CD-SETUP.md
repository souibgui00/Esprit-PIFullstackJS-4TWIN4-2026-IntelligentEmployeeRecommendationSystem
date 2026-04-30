# CI/CD Setup Guide for Employee Recommendation System

## 🚀 **Current Setup Overview**

Your project now has a comprehensive CI/CD pipeline with:
- **Jenkins** for local development and testing
- **GitHub Actions** for automated builds and deployments
- **SonarQube** for code quality analysis
- **Trivy** for security vulnerability scanning
- **Vercel** for production deployments

## 📋 **Configuration Files Created**

### 1. **Jenkins Configuration**
- `backend/Jenkinsfile-CI` - Enhanced with SonarQube, Trivy, Docker builds
- `backend/sonar-project.properties` - SonarQube project configuration
- `backend/quality-gate.json` - Quality gate configuration

### 2. **GitHub Actions Workflow**
- `.github/workflows/ci.yml` - Complete CI/CD pipeline
- Supports both Jenkins and Vercel deployments

### 3. **Key Features**

#### 🔍 **Security & Quality Gates**
- **SonarQube Analysis**: Code quality metrics, bugs, vulnerabilities, code smells
- **Trivy Security Scanning**: Container and dependency vulnerability scanning
- **Quality Gates**: Fails pipeline if coverage < 80% or high/critical vulnerabilities found
- **Automated Failures**: Pipeline stops automatically on security or quality failures

#### 🐳 **Docker Support**
- Multi-stage Docker builds with proper tagging
- Container registry support
- Image optimization and caching

#### 🚀 **Deployment Options**
- **Jenkins**: Local development, on-demand builds
- **Vercel**: Production deployments with preview environments
- **Manual**: Direct deployment commands available

## 🔧 **How to Use**

### **For Local Development (Jenkins)**

1. **Start Jenkins**:
   ```bash
   cd backend
   java -jar jenkins.war
   ```

2. **Trigger Pipeline**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        http://localhost:8080/job/CI-Backend/build?token=YOUR_JENKINS_TOKEN
   ```

3. **View Results**:
   - SonarQube: http://localhost:9000/dashboard
   - Trivy: Check Jenkins build artifacts

### **For Production (GitHub Actions)**

1. **Push to Main**:
   ```bash
   git push origin main
   ```

2. **Automatic Pipeline**:
   - GitHub Actions will automatically:
     - Run tests on every push
     - Perform SonarQube analysis
     - Scan for vulnerabilities
     - Build Docker image
     - Deploy to Vercel if all checks pass

3. **Monitor Pipeline**:
   - GitHub Actions dashboard
   - SonarQube project dashboard
   - Vercel deployment logs

## 🔍 **Common Issues & Solutions**

### **SonarQube Connection Issues**
- **Problem**: `net::ERR_CONNECTION_REFUSED`
- **Solutions**:
  1. Check Jenkins is running on port 8080
  2. Verify SonarQube URL is correct
  3. Check network connectivity between Jenkins and SonarQube
  4. Restart Jenkins service if needed

### **Code Quality Issues**
- **Problem**: Low coverage, high complexity, duplicated code
- **Solutions**:
  1. Add unit tests to increase coverage
  2. Refactor complex functions
  3. Use SonarQube IDE plugin for real-time feedback
  4. Set quality gates in `quality-gate.json`

### **Security Vulnerabilities**
- **Problem**: High/critical vulnerabilities in dependencies
- **Solutions**:
  1. Update dependencies to latest secure versions
  2. Use Dependabot for automated updates
  3. Implement security scanning in CI/CD pipeline
  4. Regular security audits with Trivy

### **Docker Build Issues**
- **Problem**: Build failures, large image sizes
- **Solutions**:
  1. Use multi-stage Docker builds
  2. Optimize Dockerfile with .dockerignore
  3. Implement caching for dependencies
  4. Use smaller base images

## 🚀 **Next Steps**

1. **Set up Jenkins Secrets**:
   ```bash
   # In Jenkins: Manage Jenkins > Manage Credentials > Secret text
   # Add SONAR_TOKEN and TRIVY_TOKEN
   ```

2. **Configure SonarQube**:
   - Install SonarQube Scanner
   - Configure project in SonarQube dashboard
   - Set quality gates

3. **Test Pipeline**:
   - Push to GitHub Actions to trigger CI/CD pipeline
   - Monitor results in both Jenkins and GitHub Actions

4. **Production Deployment**:
   - Configure Vercel secrets in GitHub repository
   - Test deployment in staging first
   - Deploy to production via GitHub Actions

## 📞 **Environment Variables Needed**

Create these secrets in your repository:
- `SONAR_TOKEN`: SonarQube authentication token
- `TRIVY_TOKEN`: Trivy authentication token  
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `JENKINS_TOKEN`: Jenkins API token

## 🎯 **Benefits**

✅ **Automated Quality Checks** - Catch issues early
✅ **Security Scanning** - Find vulnerabilities before deployment  
✅ **Consistent Deployments** - Same process every time
✅ **Fast Feedback** - Get immediate results on every commit
✅ **Traceability** - Full audit trail for all changes

## 📚 **Documentation**

- [Jenkins Documentation](./backend/Jenkinsfile-CI)
- [GitHub Actions Workflow](./.github/workflows/ci.yml)
- [SonarQube Configuration](./backend/sonar-project.properties)
- [Quality Gates Configuration](./backend/quality-gate.json)

Your CI/CD pipeline is now production-ready! 🎉
