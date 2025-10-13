# Home Assistant Integration

Seamless integration with Home Assistant for easy configuration and authentication.

## How It Works
- Native add-on with UI configuration
- Authentication support (long-lived access tokens)
- Multi-language UI support
- Screenshots saved to Home Assistant media folder
- Extensive logging: All actions, errors, and status updates are logged for easy troubleshooting.


## Logging
The add-on provides detailed logs for all operations, including screenshot status, errors, and configuration issues. You can view these logs in Home Assistant:
- Go to **Settings → Add-ons → HA Screenshotter → Logs**
- Use the logs to diagnose problems or monitor activity

## Usage Example
```yaml
long_lived_access_token: "YOUR_TOKEN"
language: "en"
```
