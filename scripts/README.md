# Development Scripts

## Quick Start Development Connection

### One-Command Setup

```bash
# From anywhere in the project:
./scripts/dev
```

This single command will:
- ✅ Connect to your VPS via SSH
- ✅ Start PostgreSQL container if not running
- ✅ Set up port forwarding (PostgreSQL accessible at `localhost:15432`)
- ✅ Test the database connection
- ✅ Drop you into an interactive SSH session on the VPS

### What You Get

**PostgreSQL Access:**
- **Host:** `localhost`
- **Port:** `15432`
- **Database:** `mtk_care_mj`
- **Username:** `mtk_mj`
- **Password:** `W1xDx1vlVqFHppobZrxW`
- **Connection String:** `postgresql://mtk_mj:W1xDx1vlVqFHppobZrxW@localhost:15432/mtk_care_mj`

**VPS SSH Session:**
- Automatically starts in `/home/mj/dev/mtk-care`
- PostgreSQL port forwarding active in background
- Ready to run Django and Next.js development servers

### Daily Workflow

1. **Start Development:**
   ```bash
   ./scripts/dev
   ```

2. **On VPS (in the SSH session):**
   ```bash
   # Terminal 1: Django
   cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000
   
   # Terminal 2: Next.js (use tmux for multiple terminals)
   tmux new-session -s frontend
   cd frontend && npm run dev
   ```

3. **On Local Machine:** 
   - Access Django: `http://VPS_IP:8000`
   - Access Next.js: `http://VPS_IP:3000`
   - Access PostgreSQL: `localhost:15432` (via any PostgreSQL client)

4. **When Done:**
   - Press `Ctrl+C` or `exit` in the SSH session
   - Port forwarding automatically stops

### Advanced Usage

**Manual Port Forwarding Only:**
```bash
ssh -L 15432:localhost:5432 mj@YOUR_VPS_IP
```

**Check PostgreSQL Status:**
```bash
ssh mj@YOUR_VPS_IP "docker ps | grep postgres"
```

**Start PostgreSQL if Stopped:**
```bash
ssh mj@YOUR_VPS_IP "cd /home/mj/dev/mtk-care && docker compose -f docker-compose.dev.yml up -d postgres"
```

### Troubleshooting

**Port 15432 already in use:**
- The script automatically handles this
- Or manually: `lsof -ti:15432 | xargs kill -9`

**SSH connection issues:**
- Ensure SSH key is set up: `ssh-copy-id mj@YOUR_VPS_IP`
- Test basic connection: `ssh mj@YOUR_VPS_IP`

**PostgreSQL connection fails:**
- Check if container is running: `docker ps | grep postgres`
- Check if port 5432 is exposed: `docker port mtk_postgres`

### Configuration

To customize the connection, edit `scripts/local-dev-connect.sh`:

```bash
# Update these variables:
VPS_HOST="93.127.195.142"  # Your VPS IP
VPS_USER="mj"              # Your VPS username
LOCAL_PG_PORT="15432"      # Local port for PostgreSQL
```

## Role Mappings Scripts

### 🔍 `fetch_entra_groups.py`
Fetches Azure AD groups starting with "MC_" and maps them to application roles.

```bash
# Basic usage
python scripts/fetch_entra_groups.py --output role_mappings.json

# Dry run to see what would be fetched
python scripts/fetch_entra_groups.py --dry-run
```

### 🚀 `deploy_with_role_mappings.sh`
Complete deployment automation with role mappings management.

```bash
# Full deployment
./scripts/deploy_with_role_mappings.sh deploy

# Only validate current role mappings
./scripts/deploy_with_role_mappings.sh validate-only
```

### 🔒 `pre-commit-role-check.sh`
Pre-commit hook to validate role mappings before commits.

```bash
# Install as git hook
ln -s ../../scripts/pre-commit-role-check.sh .git/hooks/pre-commit
```

## Django Management Commands

```bash
# Setup role mappings
python manage.py setup_role_mappings --dry-run              # Preview
python manage.py setup_role_mappings --mappings-file file.json  # Use fetched groups

# Validate role mappings
python manage.py validate_role_mappings --check-azure

# List current mappings
python manage.py list_role_mappings
```

## Other Scripts

- `setup-development.sh` - Initial environment setup
- `verify-dev-setup.sh` - Environment verification
- `generate_openapi_types.sh` - TypeScript type generation
- `validate_api_routes.py` - API route validation
- `validate_frontend_urls.py` - Frontend URL validation
- `azure_migrate.sh` - Azure database migration
- `load_fixtures.sh` - Load development fixtures

## SSH Key Setup (Recommended)

For password-less connection:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your.email@example.com"

# Copy to VPS
ssh-copy-id mj@YOUR_VPS_IP

# Test
ssh mj@YOUR_VPS_IP "echo 'SSH key working!'"
```

This eliminates password prompts and makes the development connection seamless.