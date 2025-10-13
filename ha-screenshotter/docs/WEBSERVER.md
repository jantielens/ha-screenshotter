# Optional Web Server

Access screenshots externally via a built-in web server with gallery interface.

# ⚠️ **Warning: No Authentication!**

The built-in web server does **not** have any authentication. Screenshots are accessible from outside Home Assistant to anyone on the network. If your screenshots contain sensitive information, anyone with network access to the server can view them. Only enable the web server on trusted networks!

## How It Works
- Enable web server for external access by setting `webserverport` to a value greater than 0.
- If `webserverport` is set to 0, the web server is not started and screenshots are only available locally.
- Gallery view and direct image URLs (e.g., `http://your-home-assistant-ip:3000/screenshots/0.png`)
- Health check endpoint available at `http://your-home-assistant-ip:3000/health` (returns status info)
- No authentication for trusted networks

## Usage Example
```yaml
webserverport: 3000
```