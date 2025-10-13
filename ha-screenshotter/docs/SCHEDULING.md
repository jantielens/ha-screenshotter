# Flexible Scheduling

Automate screenshot timing using cron expressions and configurable intervals.

## How It Works
- Full cron expression support
- Configurable intervals (minute, hourly, daily, etc.)
- Automatic execution and overlap prevention

## Usage Example
```yaml
schedule: "*/10 * * * *"  # Every 10 minutes
```

## More Examples
```yaml
# Every hour
schedule: "0 * * * *"

# Twice daily (8 AM and 8 PM)
schedule: "0 8,20 * * *"

# Weekly on Sunday at midnight
schedule: "0 0 * * 0"
```
