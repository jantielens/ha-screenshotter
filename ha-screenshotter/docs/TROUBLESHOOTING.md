# Troubleshooting

Common issues and solutions for HA Screenshotter.

## Skipped Executions
If you see "⏸️ EXECUTION SKIPPED" in logs, the previous run is still in progress. This prevents resource conflicts and file overwrites.

**Solutions:**
- Increase interval between runs (e.g., change from `* * * * *` to `*/5 * * * *`)
- Reduce number of URLs
- Optimize page load times
- Check execution duration in logs

## Screenshots Not Appearing
- Ensure URLs are reachable from the add-on
- Review logs for errors

## Web Server Not Accessible
- Confirm `webserverport` is set and not 0
- Check firewall/network settings

## Authentication Issues
- Verify long-lived access token is correct and not expired
- Ensure Home Assistant dashboard is accessible with the token

## Other Issues
- Review logs for error messages
- Report issues on [GitHub](https://github.com/jantielens/ha-screenshotter/issues)