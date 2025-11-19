# Brew Services Commands

## Stop a Service

```bash
brew services stop <service-name>
```

**Examples:**
```bash
brew services stop postgresql
brew services stop redis
```

---

## Common Services

### PostgreSQL
```bash
# Stop
brew services stop postgresql

# Start
brew services start postgresql

# Restart
brew services restart postgresql

# Check status
brew services list | grep postgresql
```

### Redis
```bash
# Stop
brew services stop redis

# Start
brew services start redis

# Restart
brew services restart redis
```

---

## List All Services

```bash
brew services list
```

Shows all services and their status (Started/Stopped).

---

## Quick Reference

| Command | What It Does |
|---------|--------------|
| `brew services stop <name>` | Stop a service |
| `brew services start <name>` | Start a service |
| `brew services restart <name>` | Restart a service |
| `brew services list` | List all services |

---

## Example

**Stop PostgreSQL:**
```bash
brew services stop postgresql
```

**Check if it stopped:**
```bash
brew services list
```

Should show `postgresql` as `stopped`.

