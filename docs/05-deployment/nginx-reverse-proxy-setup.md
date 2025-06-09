# Nginx Reverse Proxy Setup for MTK Care

## Overview

This guide sets up nginx as a reverse proxy for both development and production environments. Nginx provides HTTPS support, security, and performance benefits while working seamlessly with your existing gunicorn + Django setup.

## Architecture

### Before (Direct Access)
```
Internet → :3000 (Next.js)
        → :8000 (Django/Gunicorn)
```

### After (Nginx Reverse Proxy)
```
Internet → Nginx (:80/:443) → :3000 (Next.js)
                            → :8000 (Django/Gunicorn)
```

## Benefits

1. **HTTPS Support**: Required for Azure AD authentication (non-localhost)
2. **Security**: Rate limiting, security headers, DDoS protection
3. **Performance**: Static file serving, compression, caching
4. **Simplicity**: Single entry point for both frontend and backend
5. **Production Ready**: Industry standard Django deployment pattern

## Installation Steps

### 1. Install nginx and Certbot

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install nginx and SSL tools
sudo apt install nginx certbot python3-certbot-nginx -y

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 2. Basic nginx Configuration

Create the site configuration:

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create MTK Care configuration
sudo nano /etc/nginx/sites-available/mtk-care
```

Add this configuration:

```nginx
# /etc/nginx/sites-available/mtk-care
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend (Next.js) - All requests go here first
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Backend API (Django/Gunicorn)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Django admin (optional)
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django static files (served by nginx for better performance)
    location /static/ {
        alias /home/mj/dev/mtk-care/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Django media files
    location /media/ {
        alias /home/mj/dev/mtk-care/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # File upload size limit
    client_max_body_size 100M;
}
```

### 3. Enable the Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/mtk-care /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Configure Domain (Required for SSL)

You need a domain name pointing to your VPS IP. Options:

#### Option A: Use Existing Domain
- Create an A record: `dev.yourdomain.com` → `YOUR_VPS_IP`
- Update nginx config with your domain name

#### Option B: Free Domain (for testing)
- Get free domain from: freenom.com, duckdns.org, or noip.com
- Point it to your VPS IP

#### Option C: Use IP with nip.io (for testing only)
- Use: `YOUR_VPS_IP.nip.io` (e.g., `192.168.1.100.nip.io`)
- This automatically resolves to your IP

### 5. Set Up HTTPS with Let's Encrypt

```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended)

# Test auto-renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

### 6. Update Application Configuration

#### Frontend Environment Variables
```bash
# Update frontend/.env.local
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_DJANGO_API_URL=https://your-domain.com/api
```

#### Backend Django Settings
```python
# backend/config/settings/development.py
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com', 'localhost']
CORS_ALLOWED_ORIGINS = [
    'https://your-domain.com',
    'https://www.your-domain.com',
    'http://localhost:3000',  # Keep for local dev
]
```

### 7. Restart Services

```bash
# Restart your applications
cd /home/mj/dev/mtk-care/backend
source .venv/bin/activate
python manage.py runserver 127.0.0.1:8000  # Note: 127.0.0.1 instead of 0.0.0.0

# In another terminal
cd /home/mj/dev/mtk-care/frontend
npm run dev -- -H 127.0.0.1 -p 3000  # Note: 127.0.0.1 instead of 0.0.0.0

# Reload nginx
sudo systemctl reload nginx
```

## Azure AD Configuration

### Update Redirect URIs
In your Azure AD app registration, add:
- `https://your-domain.com/api/auth/callback/azure-ad`
- Keep `http://localhost:3000/api/auth/callback/azure-ad` for local development

### Update API Scopes (if needed)
- Add `https://your-domain.com` to allowed origins

## Testing

### 1. Test HTTP → HTTPS Redirect
```bash
curl -I http://your-domain.com
# Should return 301/302 redirect to https://
```

### 2. Test Frontend
```bash
curl -I https://your-domain.com
# Should return 200 OK from Next.js
```

### 3. Test Backend API
```bash
curl -I https://your-domain.com/api/v1/users/me/
# Should return response from Django
```

### 4. Test Azure AD Authentication
- Visit `https://your-domain.com`
- Click "Sign in with Microsoft"
- Should redirect to Azure AD without localhost errors

## Troubleshooting

### Common Issues

#### 1. 502 Bad Gateway
```bash
# Check if your apps are running
ps aux | grep python  # Django
ps aux | grep node    # Next.js

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Check nginx SSL config
sudo nginx -t
```

#### 3. CORS Issues
- Make sure CORS_ALLOWED_ORIGINS includes your domain
- Check browser dev tools network tab for CORS errors

#### 4. Azure AD Redirect Issues
- Verify redirect URI exactly matches what's in Azure AD
- Check that NEXTAUTH_URL uses https://

### Useful Commands

```bash
# Nginx commands
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# SSL certificate management
sudo certbot certificates
sudo certbot renew
sudo certbot delete --cert-name your-domain.com
```

## Production Considerations

### 1. Performance Optimization
```nginx
# Add to nginx config for production
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Enable HTTP/2
listen 443 ssl http2;
```

### 2. Security Enhancements
```nginx
# Additional security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

### 3. Rate Limiting
```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Add to server block
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... rest of config
}
```

### 4. Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor nginx status
curl http://localhost/nginx_status  # Requires stub_status module
```

## Integration with Existing Setup

This nginx setup works seamlessly with your current:
- **Development**: Apps run locally, nginx provides HTTPS
- **Production**: Nginx replaces direct gunicorn access
- **Docker**: Can be used alongside or instead of Docker setup

The nginx configuration is additive - it doesn't break your existing development workflow, just adds HTTPS and performance benefits.

## Next Steps

1. **Set up domain** (or use nip.io for testing)
2. **Install and configure nginx** with the provided config
3. **Get SSL certificate** with certbot
4. **Update Azure AD** redirect URIs
5. **Test authentication** flow end-to-end

This setup gives you a production-ready architecture while maintaining development flexibility!