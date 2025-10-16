/**
 * Web server for screenshot gallery
 */

const fs = require('fs-extra');
const express = require('express');
const { SCREENSHOTS_PATH } = require('./constants');

/**
 * Set up a basic web server to serve screenshots
 */
function setupWebServer(config) {
  const app = express();
  const PORT = config.webserverport;
  
  // Serve static files from the screenshots directory, but block temporary files
  app.use('/screenshots', (req, res, next) => {
    // Block access to temporary files (files ending with _temp.png or _temp.png.crc32)
    if (req.path.endsWith('_temp.png') || req.path.endsWith('_temp.png.crc32')) {
      return res.status(404).send('Not Found');
    }
    next();
  }, express.static(SCREENSHOTS_PATH));
  
  // Main page with a simple gallery view
  app.get('/', async (req, res) => {
    try {
      // Read all screenshot files (exclude temporary files and checksum files)
      const files = await fs.readdir(SCREENSHOTS_PATH);
      const imageFiles = files
        .filter(file => file.endsWith('.png') && !file.endsWith('_temp.png') && !file.endsWith('.crc32'))
        .sort();
      
      // Generate HTML page
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HA Screenshotter Gallery</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .info {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .screenshot-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .screenshot-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .screenshot-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            cursor: pointer;
        }
        .screenshot-info {
            padding: 15px;
        }
        .screenshot-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        .screenshot-time {
            color: #666;
            font-size: 0.9em;
        }

        .refresh-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 0;
        }
        .refresh-btn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 HA Screenshotter Gallery</h1>
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    </div>
    
    <div class="info">
        <h3>Configuration</h3>
        <p><strong>Schedule:</strong> ${config.schedule}</p>
        <p><strong>URLs:</strong> ${config.urls.length} configured</p>
        <p><strong>Resolution:</strong> ${config.resolution_width}x${config.resolution_height}</p>
        <p><strong>Last Update:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="gallery">
        ${imageFiles.map((file, index) => `
            <div class="screenshot-card">
                <img src="/screenshots/${file}" alt="Screenshot ${index + 1}" onclick="window.open('/screenshots/${file}', '_blank')">
                <div class="screenshot-info">
                    <div class="screenshot-name">Screenshot ${index + 1}</div>
                    <div class="screenshot-time">File: ${file}</div>
                </div>
            </div>
        `).join('')}
    </div>
    
    ${imageFiles.length === 0 ? '<p style="text-align: center; color: #666; font-size: 1.2em;">No screenshots found. Screenshots will appear here once they are generated.</p>' : ''}
    
    <script>
        // Auto-refresh every 60 seconds
        setInterval(() => {
            location.reload();
        }, 60000);
    </script>
</body>
</html>`;
      
      res.send(html);
    } catch (error) {
      console.error('❌ Error serving web page:', error.message);
      res.status(500).send('Error loading screenshots');
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      screenshots_path: SCREENSHOTS_PATH,
      config: {
        schedule: config.schedule,
        url_count: config.urls.length,
        resolution: `${config.resolution_width}x${config.resolution_height}`
      }
    });
  });
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server started on port ${PORT}`);
    console.log(`📱 Access the gallery at: http://localhost:${PORT}`);
    console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  });
}

module.exports = {
  setupWebServer
};
