# CRMS Production Deployment Guide

**Criminal Record Management System (CRMS)**
**Version:** 1.0
**Target Audience:** System Administrators, DevOps Engineers, IT Directors
**Estimated Deployment Time:** 4-6 hours (first deployment)

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [System Requirements](#2-system-requirements)
3. [Server Preparation](#3-server-preparation)
4. [Security Hardening](#4-security-hardening)
5. [SSL/TLS Certificate Setup](#5-ssltls-certificate-setup)
6. [Secrets Management](#6-secrets-management)
7. [Environment Configuration](#7-environment-configuration)
8. [Database Initialization](#8-database-initialization)
9. [Application Deployment](#9-application-deployment)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Country-Specific Customization](#11-country-specific-customization)
12. [Backup & Restore Procedures](#12-backup--restore-procedures)
13. [Monitoring & Logging](#13-monitoring--logging)
14. [Maintenance](#14-maintenance)
15. [Scaling](#15-scaling)
16. [Troubleshooting](#16-troubleshooting)
17. [Emergency Procedures](#17-emergency-procedures)

---

## 1. Pre-Deployment Checklist

### 1.1 Organizational Readiness

- [ ] **Legal & Compliance**
  - [ ] Data Protection Officer (DPO) appointed
  - [ ] Privacy policy reviewed and approved
  - [ ] GDPR/Malabo Convention compliance verified
  - [ ] Country-specific data protection laws reviewed
  - [ ] Data Processing Agreement (DPA) signed (if applicable)

- [ ] **Administrative Readiness**
  - [ ] Deployment team identified (min 3 people: SysAdmin, DBA, Security Officer)
  - [ ] Station structure documented (codes, names, hierarchy)
  - [ ] User roles and permissions mapped
  - [ ] Initial admin users identified
  - [ ] Change management process defined

- [ ] **Technical Readiness**
  - [ ] Server infrastructure provisioned
  - [ ] Domain name registered and configured
  - [ ] SSL/TLS certificates obtained
  - [ ] Backup infrastructure ready
  - [ ] Disaster recovery plan documented

### 1.2 Documentation Review

- [ ] Read `README.md` - Project overview
- [ ] Read `CLAUDE.md` - Development guide
- [ ] Read `SECURITY.md` - Security policies
- [ ] Read `PRIVACY_POLICY.md` - Privacy compliance
- [ ] Read `MULTI_COUNTRY_DEPLOYMENT.md` - Country customization
- [ ] Review `docker-compose.prod.yml` - Production configuration

### 1.3 Infrastructure Checklist

- [ ] Production server(s) provisioned
- [ ] Backup server provisioned
- [ ] Network configured (firewall, load balancer)
- [ ] Monitoring tools installed (Prometheus, Grafana, or equivalent)
- [ ] Log aggregation configured (ELK Stack, or equivalent)
- [ ] Intrusion Detection System (IDS) configured
- [ ] VPN access for remote administration

---

## 2. System Requirements

### 2.1 Minimum Production Requirements

**Application Server:**
- **CPU:** 4 cores (8 recommended for high-traffic)
- **RAM:** 8GB (16GB recommended)
- **Storage:** 100GB SSD (minimum), 500GB+ recommended
- **OS:** Ubuntu 22.04 LTS, Debian 11, or RHEL 8+
- **Docker:** Docker Engine 20.10+, Docker Compose 2.0+

**Database Server (can be same as app server for small deployments):**
- **CPU:** 2 cores (4 recommended)
- **RAM:** 4GB (8GB recommended)
- **Storage:** 200GB SSD (for database + backups)

**Network:**
- **Internet:** Stable connection (10 Mbps minimum, 100 Mbps recommended)
- **Bandwidth:** 1TB/month minimum (depends on usage)
- **Static IP:** Required for production

### 2.2 Recommended Production Configuration

**High-Traffic Deployment (100+ concurrent officers):**
- **Application Servers:** 2+ (load balanced)
- **Database Server:** Dedicated PostgreSQL server (master-replica setup)
- **Storage Server:** Dedicated MinIO cluster (distributed mode)
- **Cache Server:** Dedicated Redis cluster
- **Reverse Proxy:** Dedicated Nginx/HAProxy load balancer

**Medium-Traffic Deployment (20-100 concurrent officers):**
- **Application Server:** Single server with 8 cores, 16GB RAM
- **Combined Services:** PostgreSQL, Redis, MinIO on same server
- **Load Balancer:** Nginx reverse proxy

**Low-Traffic Deployment (1-20 concurrent officers):**
- **Single Server:** All services on one server (4 cores, 8GB RAM)
- **Docker Compose:** Use `docker-compose.prod.yml` as-is

### 2.3 Software Requirements

- **Operating System:** Ubuntu 22.04 LTS (recommended) or equivalent
- **Docker Engine:** 20.10+ ([installation guide](https://docs.docker.com/engine/install/))
- **Docker Compose:** 2.0+ ([installation guide](https://docs.docker.com/compose/install/))
- **Git:** For cloning repository
- **OpenSSL:** For generating secrets
- **curl/wget:** For health checks

---

## 3. Server Preparation

### 3.1 Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim htop ufw fail2ban

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (replace 'deploy' with your username)
sudo usermod -aG docker deploy
newgrp docker

# Verify installations
docker --version
docker-compose --version
```

### 3.2 Create Directory Structure

```bash
# Create application directory
sudo mkdir -p /opt/crms
sudo chown -R $USER:$USER /opt/crms
cd /opt/crms

# Clone repository
git clone https://github.com/[your-org]/crms.git .
git checkout main

# Create data directories
sudo mkdir -p /var/lib/crms/{postgres,minio}
sudo mkdir -p /var/backups/crms/postgres
sudo mkdir -p /var/log/crms/{app,nginx,postgres}
sudo chown -R 1000:1000 /var/lib/crms /var/backups/crms /var/log/crms

# Create secrets directory
mkdir -p /opt/crms/secrets
chmod 700 /opt/crms/secrets
```

### 3.3 System Tuning (Optional but Recommended)

```bash
# Increase file descriptor limits
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
* soft nofile 65536
* hard nofile 65536
EOF

# Optimize kernel parameters for PostgreSQL
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF
# PostgreSQL tuning
vm.swappiness = 10
vm.overcommit_memory = 2
vm.overcommit_ratio = 80
kernel.shmmax = 4294967296
kernel.shmall = 1048576
EOF

sudo sysctl -p
```

---

## 4. Security Hardening

### 4.1 Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (change port if non-standard)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS only
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other inbound traffic
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Verify firewall rules
sudo ufw status verbose
```

### 4.2 Fail2Ban Configuration

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Create custom jail for CRMS
sudo tee /etc/fail2ban/jail.d/crms.conf > /dev/null <<EOF
[crms-auth]
enabled = true
port = 80,443
filter = crms-auth
logpath = /var/log/crms/app/app.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Create filter for failed login attempts
sudo tee /etc/fail2ban/filter.d/crms-auth.conf > /dev/null <<EOF
[Definition]
failregex = ^.*"action":"login_failed".*"ip":"<HOST>".*$
ignoreregex =
EOF

# Restart fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 4.3 SSH Hardening

```bash
# Disable root login and password authentication
sudo sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd
```

### 4.4 Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Enable automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 5. SSL/TLS Certificate Setup

### 5.1 Option A: Let's Encrypt (Recommended for Internet-Facing Deployments)

```bash
# Install Certbot
sudo apt install -y certbot

# Create Nginx configuration first (see Section 9.4)

# Obtain certificate (replace with your domain)
sudo docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email \
  -d crms.example.com

# Verify certificate
sudo ls -la /opt/crms/ssl/certs/live/crms.example.com/

# Certificates will be automatically renewed by certbot container
```

### 5.2 Option B: Custom SSL Certificates

```bash
# Create SSL directories
mkdir -p /opt/crms/ssl/{certs,private}
chmod 700 /opt/crms/ssl/private

# Copy your SSL certificate and key
sudo cp /path/to/your-cert.pem /opt/crms/ssl/certs/crms.crt
sudo cp /path/to/your-key.pem /opt/crms/ssl/private/crms.key
sudo chmod 600 /opt/crms/ssl/private/crms.key

# Generate Diffie-Hellman parameters (takes 5-10 minutes)
openssl dhparam -out /opt/crms/ssl/dhparam.pem 2048
```

### 5.3 Option C: Self-Signed Certificate (Development/Intranet Only)

```bash
# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/crms/ssl/private/crms.key \
  -out /opt/crms/ssl/certs/crms.crt \
  -subj "/C=SL/ST=Western/L=Freetown/O=SierraLeonePolice/CN=crms.local"

# Generate DH parameters
openssl dhparam -out /opt/crms/ssl/dhparam.pem 2048
```

---

## 6. Secrets Management

### 6.1 Generate Strong Secrets

```bash
cd /opt/crms

# Generate NextAuth secret (32 bytes, base64)
openssl rand -base64 32 > secrets/nextauth_secret.txt

# Generate encryption key (32 bytes, hex)
openssl rand -hex 32 > secrets/encryption_key.txt

# Generate database password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25 > secrets/db_password.txt

# Generate MinIO credentials
echo "crms_admin_$(openssl rand -hex 4)" > secrets/minio_root_user.txt
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25 > secrets/minio_root_password.txt

# Generate Redis password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25 > secrets/redis_password.txt

# USSD API key (obtain from Africa's Talking or Twilio)
echo "YOUR_USSD_API_KEY" > secrets/ussd_api_key.txt

# Secure secrets directory
chmod 600 secrets/*
chmod 700 secrets/
```

### 6.2 Backup Secrets (CRITICAL!)

```bash
# Backup secrets to secure location (USB drive, encrypted volume, password manager)
tar -czf crms-secrets-backup-$(date +%Y%m%d).tar.gz secrets/
gpg --symmetric --cipher-algo AES256 crms-secrets-backup-$(date +%Y%m%d).tar.gz

# Store encrypted backup in multiple secure locations
# DO NOT LOSE THESE SECRETS - THEY CANNOT BE RECOVERED
```

---

## 7. Environment Configuration

### 7.1 Create Production Environment File

```bash
cd /opt/crms

# Create .env.production file
cat > .env.production <<'EOF'
# ============================================
# CRMS Production Environment Configuration
# ============================================

# Country Configuration
COUNTRY_CODE=SLE
COUNTRY_NAME="Sierra Leone"

# Domain & URLs
DOMAIN_NAME=crms.example.com
NEXTAUTH_URL=https://crms.example.com

# Database
DB_USER=crms
DB_NAME=crms
DB_SHARED_BUFFERS=256MB
DB_EFFECTIVE_CACHE_SIZE=1GB
DB_WORK_MEM=16MB
DB_MAINTENANCE_WORK_MEM=128MB

# Database Password (loaded from secrets/db_password.txt)
DB_PASSWORD=$(cat secrets/db_password.txt)

# Redis Password (loaded from secrets/redis_password.txt)
REDIS_PASSWORD=$(cat secrets/redis_password.txt)

# USSD Configuration (Africa's Talking)
USSD_USERNAME=sandbox
USSD_SHORTCODE=*123#

# Feature Flags
ENABLE_USSD=true
ENABLE_MFA=true
ENABLE_OFFLINE=true
ENABLE_ANALYTICS=false

# Security Settings
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
SESSION_TIMEOUT=900000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Backup Configuration
BACKUP_RETENTION_DAYS=30

# Data Paths
DATA_PATH=/var/lib/crms
BACKUP_PATH=/var/backups/crms
LOG_PATH=/var/log/crms

# Application Version
VERSION=1.0.0
EOF

# Secure environment file
chmod 600 .env.production
```

### 7.2 Customize for Your Country

Edit `/opt/crms/.env.production` and update:

```bash
# For Ghana deployment, for example:
COUNTRY_CODE=GHA
COUNTRY_NAME="Ghana"
DOMAIN_NAME=crms.ghanapolice.gov.gh

# For Kenya deployment:
COUNTRY_CODE=KEN
COUNTRY_NAME="Kenya"
DOMAIN_NAME=crms.nationalpolice.go.ke
```

See `MULTI_COUNTRY_DEPLOYMENT.md` for detailed country customization guide.

---

## 8. Database Initialization

### 8.1 Start Database Service

```bash
cd /opt/crms

# Start PostgreSQL only
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for database to be healthy (30-60 seconds)
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### 8.2 Run Database Migrations

```bash
# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U crms -d crms -c "SELECT version();"

# Copy Prisma schema to running container (if needed)
docker-compose -f docker-compose.prod.yml cp prisma/schema.prisma app:/app/prisma/

# Run migrations (will apply all migrations from prisma/migrations/)
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Verify migrations
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "\dt"
```

### 8.3 Seed Initial Data

**IMPORTANT:** Review and customize `prisma/seed.ts` before running!

```bash
# Edit seed file to customize for your country
nano prisma/seed.ts

# Update:
# - Station names, codes, districts (lines 50-150)
# - Initial admin badge number (line 200)
# - Roles and permissions (if customized)

# Run seed script
docker-compose -f docker-compose.prod.yml run --rm app npx prisma db seed

# Verify data
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT * FROM stations;"

docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT badge, name, role FROM officers;"
```

### 8.4 Record Initial Admin Credentials

**CRITICAL:** Record the initial admin credentials from seed output:

```
Default Super Admin Officer:
  Badge: SA-00001
  PIN: 12345678
```

**CHANGE THIS PIN IMMEDIATELY AFTER FIRST LOGIN!**

---

## 9. Application Deployment

### 9.1 Create Nginx Configuration

```bash
cd /opt/crms

# Create Nginx directory
mkdir -p nginx

# Create main Nginx configuration
cat > nginx/nginx.conf <<'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Include SSL configuration
    include /etc/nginx/conf.d/*.conf;
}
EOF
```

### 9.2 Create SSL Configuration

```bash
cat > nginx/ssl.conf <<'EOF'
# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    server_name ${NGINX_HOST};

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name ${NGINX_HOST};

    # SSL Certificate
    ssl_certificate /etc/nginx/ssl/certs/crms.crt;
    ssl_certificate_key /etc/nginx/ssl/private/crms.key;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # SSL Configuration (Mozilla Modern Profile)
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';" always;

    # Logging
    access_log /var/log/nginx/crms_access.log;
    error_log /var/log/nginx/crms_error.log warn;

    # Root location - proxy to Next.js app
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
    }

    # API routes - rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login endpoint - stricter rate limiting
    location /api/auth/signin {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # MinIO S3 API (internal only)
    location /minio/ {
        proxy_pass http://minio:9000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }

    # MinIO Console (admin only - consider removing or securing further)
    location /minio-console/ {
        proxy_pass http://minio:9001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Basic auth for MinIO console (optional)
        # auth_basic "MinIO Console";
        # auth_basic_user_file /etc/nginx/.htpasswd;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://app:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 9.3 Create Backup Script

```bash
mkdir -p scripts

cat > scripts/backup.sh <<'EOF'
#!/bin/sh
# CRMS Backup Script
# Runs daily via cron in backup container

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "Starting backup at $(date)"

# PostgreSQL backup
echo "Backing up PostgreSQL database..."
pg_dump -U ${PGUSER} -d ${PGDATABASE} -h ${PGHOST} -p ${PGPORT} \
  --format=custom --compress=9 --verbose \
  --file="${BACKUP_DIR}/crms_db_${DATE}.dump"

# Verify backup
echo "Verifying backup..."
pg_restore --list "${BACKUP_DIR}/crms_db_${DATE}.dump" > /dev/null

# Create checksum
sha256sum "${BACKUP_DIR}/crms_db_${DATE}.dump" > "${BACKUP_DIR}/crms_db_${DATE}.dump.sha256"

# Compress backup (optional - already compressed by pg_dump)
# gzip "${BACKUP_DIR}/crms_db_${DATE}.dump"

# Remove old backups
echo "Removing backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "crms_db_*.dump" -type f -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "crms_db_*.dump.sha256" -type f -mtime +${RETENTION_DAYS} -delete

echo "Backup completed successfully at $(date)"
echo "Backup file: ${BACKUP_DIR}/crms_db_${DATE}.dump"
echo "Backup size: $(du -h ${BACKUP_DIR}/crms_db_${DATE}.dump | cut -f1)"
EOF

chmod +x scripts/backup.sh
```

### 9.4 Build and Start All Services

```bash
cd /opt/crms

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Build application image
docker-compose -f docker-compose.prod.yml build --no-cache app

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Wait for all services to be healthy (2-3 minutes)
watch docker-compose -f docker-compose.prod.yml ps
```

### 9.5 Verify All Services are Running

```bash
# Check all containers
docker-compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                STATUS
# crms-app            Up (healthy)
# crms-nginx          Up (healthy)
# crms-db             Up (healthy)
# crms-storage        Up (healthy)
# crms-redis          Up (healthy)
# crms-certbot        Up
# crms-backup         Up

# Check logs for any errors
docker-compose -f docker-compose.prod.yml logs --tail=50
```

---

## 10. Post-Deployment Verification

### 10.1 Health Checks

```bash
# Check API health endpoint
curl -k https://crms.example.com/api/health

# Expected output:
# {"status":"ok","timestamp":"2025-01-04T10:30:00.000Z"}

# Check SSL certificate
curl -vI https://crms.example.com 2>&1 | grep -i "SSL connection"

# Check database connection
docker-compose -f docker-compose.prod.yml exec app npx prisma db execute --stdin <<< "SELECT 1;"
```

### 10.2 Login Test

1. **Open browser:** https://crms.example.com
2. **Login with default admin:**
   - Badge: `SA-00001`
   - PIN: `12345678`
3. **Verify dashboard loads**
4. **IMMEDIATELY CHANGE PIN:**
   - Go to Profile > Security
   - Change PIN to strong, unique PIN
   - Record new PIN in secure location

### 10.3 Feature Tests

```bash
# Test USSD endpoint (if enabled)
curl -X POST https://crms.example.com/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","serviceCode":"*123#","phoneNumber":"+23277000000","text":""}'

# Test background check API
curl -X POST https://crms.example.com/api/background-checks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"nin":"1234567890","purpose":"officer"}'
```

### 10.4 Performance Baseline

```bash
# Install Apache Bench (if not installed)
sudo apt install -y apache2-utils

# Test login page performance
ab -n 100 -c 10 https://crms.example.com/auth/signin

# Review response times and ensure:
# - Median response time < 500ms
# - No failed requests
# - No 500 errors
```

### 10.5 Security Audit

```bash
# Run SSL Labs test (external service)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=crms.example.com
# Target Grade: A or A+

# Check security headers
curl -I https://crms.example.com | grep -i "strict-transport-security\|x-frame-options\|x-content-type-options"

# Test for common vulnerabilities
# Install OWASP ZAP or Nikto for comprehensive testing
nikto -h https://crms.example.com
```

---

## 11. Country-Specific Customization

### 11.1 Customize Station Structure

```bash
# Edit seed file with your country's stations
nano prisma/seed.ts

# Update stations array (lines 50-150):
const stations = [
  { code: "HQ", name: "National Headquarters", district: "Capital", region: "Central" },
  { code: "STN01", name: "Your Station Name", district: "Your District", region: "Your Region" },
  // ... add all your stations
];

# Re-seed database (WARNING: This will clear existing data!)
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate reset --force
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### 11.2 Customize National ID Field

See `MULTI_COUNTRY_DEPLOYMENT.md` Section 3.1 for detailed instructions.

```bash
# For Ghana (Ghana Card):
# 1. Update Prisma schema: nin -> ghanaCardNumber
# 2. Run migration: npx prisma migrate dev --name update-id-field
# 3. Update validation rules in lib/validation.ts
```

### 11.3 Localization (Multi-Language Support)

```bash
# Install i18n package (if not already installed)
docker-compose -f docker-compose.prod.yml exec app npm install next-i18next

# Create translation files
mkdir -p public/locales/{en,fr,pt,ar}

# Add translations
# en (English), fr (French), pt (Portuguese), ar (Arabic)
# See MULTI_COUNTRY_DEPLOYMENT.md Section 5 for details
```

### 11.4 USSD Integration

```bash
# Configure for your country's telecom provider
nano .env.production

# For Africa's Talking (Kenya, Tanzania, Uganda, Rwanda):
USSD_API_KEY=your_api_key_here
USSD_USERNAME=your_sandbox_username
USSD_SHORTCODE=*123#

# For Twilio (Multi-country):
USSD_API_KEY=your_twilio_account_sid
USSD_USERNAME=your_twilio_auth_token
USSD_SHORTCODE=+1234567890

# Restart application
docker-compose -f docker-compose.prod.yml restart app
```

---

## 12. Backup & Restore Procedures

### 12.1 Automated Daily Backups

Backups run automatically at 2:00 AM daily via the backup container.

```bash
# Verify backup cron job
docker-compose -f docker-compose.prod.yml exec backup crontab -l

# View backup logs
docker-compose -f docker-compose.prod.yml logs backup

# List backups
ls -lh /var/backups/crms/postgres/

# Expected output:
# crms_db_20250104_020000.dump
# crms_db_20250104_020000.dump.sha256
```

### 12.2 Manual Backup

```bash
# Trigger manual backup
docker-compose -f docker-compose.prod.yml exec backup /backup.sh

# Backup MinIO data (evidence files)
docker-compose -f docker-compose.prod.yml exec minio \
  mc mirror /data/crms-evidence /backups/minio/crms-evidence

# Backup secrets (CRITICAL!)
tar -czf /var/backups/crms/crms-secrets-$(date +%Y%m%d).tar.gz /opt/crms/secrets/
gpg --symmetric --cipher-algo AES256 /var/backups/crms/crms-secrets-$(date +%Y%m%d).tar.gz
```

### 12.3 Restore from Backup

```bash
# Stop application (keep database running)
docker-compose -f docker-compose.prod.yml stop app

# List available backups
ls -lh /var/backups/crms/postgres/

# Restore database (replace DATE with backup date)
BACKUP_FILE="/var/backups/crms/postgres/crms_db_20250104_020000.dump"

# Verify backup integrity
sha256sum -c ${BACKUP_FILE}.sha256

# Drop and recreate database
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d postgres -c "DROP DATABASE IF EXISTS crms;"

docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d postgres -c "CREATE DATABASE crms;"

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U crms -d crms --verbose --no-owner --no-acl < ${BACKUP_FILE}

# Verify restoration
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT COUNT(*) FROM officers;"

# Start application
docker-compose -f docker-compose.prod.yml start app
```

### 12.4 Offsite Backup

```bash
# Copy backups to remote server (use cron for automation)
rsync -avz --delete \
  /var/backups/crms/ \
  backup-user@backup-server:/backups/crms/

# Or use cloud storage (AWS S3, MinIO external)
mc alias set backup-s3 https://backup.example.com ACCESS_KEY SECRET_KEY
mc mirror /var/backups/crms/ backup-s3/crms-backups/
```

---

## 13. Monitoring & Logging

### 13.1 Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# Export logs for analysis
docker-compose -f docker-compose.prod.yml logs --no-color > /tmp/crms-logs-$(date +%Y%m%d).log
```

### 13.2 Monitoring Dashboard (Optional - Prometheus + Grafana)

```bash
# Add to docker-compose.prod.yml or separate monitoring stack
# See: https://github.com/stefanprodan/dockprom

# Quick metrics
docker stats

# Container resource usage
docker-compose -f docker-compose.prod.yml top
```

### 13.3 Audit Log Review

```bash
# View audit logs (from database)
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;"

# Export audit logs for compliance
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "COPY (SELECT * FROM audit_logs WHERE created_at >= NOW() - INTERVAL '30 days') TO STDOUT CSV HEADER;" > /var/backups/crms/audit-logs-$(date +%Y%m).csv
```

### 13.4 Health Monitoring Script

```bash
# Create monitoring script
cat > /opt/crms/scripts/health_check.sh <<'EOF'
#!/bin/bash
# CRMS Health Check Script

URL="https://crms.example.com/api/health"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

response=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $response -ne 200 ]; then
  echo "CRMS is DOWN! HTTP Status: $response"

  # Send alert to Slack
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"🚨 CRMS ALERT: Application is DOWN! HTTP Status: $response\"}"

  exit 1
else
  echo "CRMS is UP. HTTP Status: $response"
  exit 0
fi
EOF

chmod +x /opt/crms/scripts/health_check.sh

# Add to cron (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/crms/scripts/health_check.sh >> /var/log/crms/health_check.log 2>&1") | crontab -
```

---

## 14. Maintenance

### 14.1 Regular Maintenance Tasks

**Daily:**
- [ ] Review logs for errors
- [ ] Check disk space: `df -h`
- [ ] Verify backups completed successfully

**Weekly:**
- [ ] Review audit logs for suspicious activity
- [ ] Check system resource usage: `docker stats`
- [ ] Review failed login attempts: `docker-compose -f docker-compose.prod.yml logs app | grep "login_failed"`

**Monthly:**
- [ ] Update Docker images: `docker-compose -f docker-compose.prod.yml pull`
- [ ] Review and archive old audit logs
- [ ] Database vacuum: `docker-compose -f docker-compose.prod.yml exec postgres vacuumdb -U crms -d crms -z`
- [ ] Review SSL certificate expiry (Let's Encrypt auto-renews)

**Quarterly:**
- [ ] Security audit (vulnerability scan)
- [ ] Performance review (response times, database size)
- [ ] Disaster recovery drill (test backup restore)

### 14.2 Updating CRMS

```bash
cd /opt/crms

# Backup before update
docker-compose -f docker-compose.prod.yml exec backup /backup.sh

# Pull latest code
git fetch origin
git checkout v1.1.0  # Replace with target version

# Review CHANGELOG.md for breaking changes

# Update dependencies
docker-compose -f docker-compose.prod.yml exec app npm install

# Run migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Rebuild application
docker-compose -f docker-compose.prod.yml build app

# Rolling update (zero downtime)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build app

# Verify update
curl https://crms.example.com/api/health
docker-compose -f docker-compose.prod.yml logs app | tail -50
```

### 14.3 Database Maintenance

```bash
# Vacuum database (reclaim space, update statistics)
docker-compose -f docker-compose.prod.yml exec postgres vacuumdb -U crms -d crms -z -v

# Analyze tables for query optimization
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "ANALYZE;"

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT pg_size_pretty(pg_database_size('crms'));"

# Check table sizes
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT schemaname AS schema, tablename AS table, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## 15. Scaling

### 15.1 Vertical Scaling (Single Server)

```bash
# Increase Docker container resources
# Edit docker-compose.prod.yml:

# For app service:
deploy:
  resources:
    limits:
      cpus: '4'      # Increase from 2
      memory: 4G     # Increase from 2G

# Restart with new resources
docker-compose -f docker-compose.prod.yml up -d
```

### 15.2 Horizontal Scaling (Multiple App Servers)

```bash
# Scale app container (requires load balancer)
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Configure Nginx for load balancing (edit nginx/ssl.conf):
upstream crms_app {
  least_conn;
  server app_1:3000;
  server app_2:3000;
  server app_3:3000;
}

# Update proxy_pass to use upstream
location / {
  proxy_pass http://crms_app;
  # ... rest of config
}
```

### 15.3 Database Scaling (Read Replicas)

See PostgreSQL replication documentation:
https://www.postgresql.org/docs/15/high-availability.html

---

## 16. Troubleshooting

### 16.1 Common Issues

**Issue: Application won't start**

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app

# Common causes:
# 1. Database not ready - wait 60 seconds and retry
# 2. Missing secrets - verify all files in secrets/ directory
# 3. Port conflict - check if port 3000 is in use: sudo lsof -i :3000

# Solution: Restart services in order
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d postgres
# Wait 60 seconds
docker-compose -f docker-compose.prod.yml up -d
```

**Issue: Cannot login**

```bash
# Check if initial admin exists
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT badge, name, role FROM officers WHERE role = 'SuperAdmin';"

# If no results, re-run seed
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed

# Check audit logs for failed logins
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT * FROM audit_logs WHERE action = 'login_failed' ORDER BY created_at DESC LIMIT 10;"
```

**Issue: SSL certificate errors**

```bash
# Verify certificate files exist
ls -la /opt/crms/ssl/certs/
ls -la /opt/crms/ssl/private/

# Test certificate validity
openssl x509 -in /opt/crms/ssl/certs/crms.crt -text -noout

# Renew Let's Encrypt certificate
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Reload Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

**Issue: Slow performance**

```bash
# Check system resources
htop

# Check Docker container stats
docker stats

# Check database performance
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Vacuum database
docker-compose -f docker-compose.prod.yml exec postgres vacuumdb -U crms -d crms -z

# Check slow queries (if pg_stat_statements enabled)
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Issue: Disk space full**

```bash
# Check disk usage
df -h

# Find large files
du -sh /var/lib/crms/* | sort -h

# Clear old Docker images
docker system prune -a --volumes

# Archive old backups
tar -czf /mnt/external/crms-backups-archive-$(date +%Y%m).tar.gz /var/backups/crms/postgres/*.dump
rm /var/backups/crms/postgres/*.dump

# Rotate logs
docker-compose -f docker-compose.prod.yml logs --no-color > /tmp/logs-archive.log
docker-compose -f docker-compose.prod.yml restart
```

### 16.2 Debug Mode

```bash
# Enable debug logging
nano .env.production
# Change: LOG_LEVEL=debug

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# View debug logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 16.3 Database Connection Issues

```bash
# Test database connection from app container
docker-compose -f docker-compose.prod.yml exec app npx prisma db execute --stdin <<< "SELECT 1;"

# Test from host
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "SELECT 1;"

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres | grep ERROR
```

---

## 17. Emergency Procedures

### 17.1 Emergency Shutdown

```bash
# Graceful shutdown (wait for connections to close)
docker-compose -f docker-compose.prod.yml down

# Immediate shutdown (force kill)
docker-compose -f docker-compose.prod.yml kill

# Stop specific service
docker-compose -f docker-compose.prod.yml stop app
```

### 17.2 Emergency Restore

```bash
# Restore from latest backup (see Section 12.3)
LATEST_BACKUP=$(ls -t /var/backups/crms/postgres/crms_db_*.dump | head -1)
echo "Restoring from: $LATEST_BACKUP"

# Follow restore procedure from Section 12.3
```

### 17.3 Security Incident Response

```bash
# 1. Isolate system
docker-compose -f docker-compose.prod.yml down
sudo ufw deny 80/tcp
sudo ufw deny 443/tcp

# 2. Collect evidence
docker-compose -f docker-compose.prod.yml logs > /tmp/incident-logs-$(date +%Y%m%d-%H%M%S).log
tar -czf /tmp/incident-evidence-$(date +%Y%m%d-%H%M%S).tar.gz /var/log/crms/ /opt/crms/.env.production

# 3. Review audit logs
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U crms -d crms -c "COPY (SELECT * FROM audit_logs WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC) TO STDOUT CSV HEADER;" > /tmp/audit-logs-incident-$(date +%Y%m%d).csv

# 4. Notify authorities
# - Data Protection Officer
# - Supervisory Authority (within 72 hours per GDPR)
# - Affected individuals

# 5. Restore from known-good backup
# Follow restore procedure from Section 12.3

# 6. Re-enable access
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
docker-compose -f docker-compose.prod.yml up -d
```

### 17.4 Data Breach Notification

See `SECURITY.md` and `PRIVACY_POLICY.md` Section 13 for data breach notification procedures.

**Timeline:**
- **0-1 hour:** Identify and contain breach
- **1-24 hours:** Investigate scope and impact
- **24-72 hours:** Notify Data Protection Authority (GDPR requirement)
- **72 hours+:** Notify affected individuals, implement remediation

---

## 18. Support & Contact

### 18.1 Technical Support

**For deployment issues:**
- **GitHub Issues:** https://github.com/[your-org]/crms/issues
- **Community Forum:** https://forum.crms.org (if available)
- **Email:** support@crms.org

**For security issues:**
- See `SECURITY.md` for responsible disclosure process
- Email: security@crms.org

### 18.2 Country-Specific Support

**Sierra Leone (Pilot):**
- **Sierra Leone Police Force IT Department**
- Email: it@sierraleonepol.gov.sl
- Phone: [To Be Assigned]

**For other countries:** Contact your deploying law enforcement agency's IT department.

---

## 19. Deployment Checklist Summary

Use this checklist for go-live verification:

### Pre-Deployment

- [ ] All documentation reviewed
- [ ] Server provisioned and hardened
- [ ] Domain name configured
- [ ] SSL certificates obtained
- [ ] Secrets generated and backed up
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup infrastructure ready

### Deployment

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Secrets configured
- [ ] Environment variables set
- [ ] Nginx configuration created
- [ ] Database initialized
- [ ] Migrations run successfully
- [ ] Initial data seeded
- [ ] All services started and healthy

### Post-Deployment

- [ ] Health checks passing
- [ ] Login successful with admin user
- [ ] Admin PIN changed
- [ ] SSL certificate valid (A/A+ grade)
- [ ] Security headers verified
- [ ] Automated backups configured
- [ ] Monitoring dashboard accessible
- [ ] Logs reviewed for errors
- [ ] Performance baseline established
- [ ] Country-specific customizations applied
- [ ] User training completed
- [ ] Documentation updated with deployment details

### Go-Live

- [ ] Final backup taken
- [ ] Rollback plan documented
- [ ] Support team briefed
- [ ] Users notified of go-live
- [ ] 24-hour monitoring period scheduled
- [ ] Incident response team on standby

---

## Conclusion

Congratulations! You have successfully deployed CRMS in production.

**Next Steps:**
1. Monitor system closely for first 48 hours
2. Train end users (officers, commanders)
3. Schedule regular maintenance windows
4. Review and update documentation as needed
5. Join the CRMS community for updates and support

**Remember:**
- Keep secrets secure and backed up
- Run regular backups and test restores
- Monitor logs for security incidents
- Keep system updated with latest patches
- Follow GDPR/Malabo Convention compliance requirements

**For questions or issues:** See Section 18 (Support & Contact)

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Next Review:** March 2025

**License:** MIT (same as CRMS software)
