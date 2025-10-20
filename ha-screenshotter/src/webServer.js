/**
 * Web server for screenshot gallery
 */

const fs = require('fs-extra');
const express = require('express');
const { SCREENSHOTS_PATH } = require('./constants');
const { SCREENSHOT_HISTORY_PATH } = require('./constants');
const archiver = require('archiver');
const { getAllCurrentCRC32, getHistory, HISTORY_LENGTH } = require('./crcHistory');

/**
 * Set up a basic web server to serve screenshots
 */
function setupWebServer(config) {
    const app = express();

    // Endpoint to serve individual history files for download
    app.get('/history-files/:filename', async (req, res) => {
        const filename = req.params.filename;
        const filePath = require('path').join(SCREENSHOT_HISTORY_PATH, filename);
        try {
            if (await fs.pathExists(filePath)) {
                // Set content type for inline display
                if (filename.endsWith('.png')) {
                    res.setHeader('Content-Type', 'image/png');
                } else if (filename.endsWith('.json')) {
                    res.setHeader('Content-Type', 'application/json');
                } else {
                    res.setHeader('Content-Type', 'application/octet-stream');
                }
                res.sendFile(filePath);
            } else {
                res.status(404).send('File not found');
            }
        } catch (error) {
            res.status(500).send('Error displaying file');
        }
    });

    // Page to display history folder contents
    app.get('/history', async (req, res) => {
        try {
            const files = await fs.readdir(SCREENSHOT_HISTORY_PATH);
            // Parse info from filenames
            const parsed = files.map(f => {
                const match = f.match(/^(\d{8}-\d{6})-([^-]+)-(original|processed|metadata)\.(png|json)$/);
                return match ? {
                    filename: f,
                    timestamp: match[1],
                    crc32: match[2],
                    type: match[3],
                    ext: match[4]
                } : null;
            }).filter(Boolean).sort((a, b) => b.filename.localeCompare(a.filename));
            // Group rows by CRC32 runs for visualization
            let rows = [];
            let lastCrc = null;
            let runIdx = -1;
            parsed.forEach((f, i) => {
                if (f.crc32 !== lastCrc) {
                    runIdx++;
                    lastCrc = f.crc32;
                }
                rows.push({ ...f, runIdx });
            });
            const palette = ['#e3f2fd', '#e8f5e9', '#f3e8ff', '#fff3e0', '#ffebee'];
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshot History Files</title>
    <style>
        body { font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'Courier', monospace; background: #f5f5f5; margin: 0; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .history-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); margin: 0 auto; font-family: inherit; }
        th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; font-family: inherit; font-size: 1em; }
        th { background: #f8f9fa; color: #333; font-family: inherit; }
        tr:hover { background: #f0f6ff; }
        .type-original { color: #007bff; font-weight: 600; }
        .type-processed { color: #28a745; font-weight: 600; }
        .type-metadata { color: #6c757d; font-weight: 600; }
        .view-link { text-decoration: none; color: #2563eb; font-weight: 500; }
        .view-link:hover { text-decoration: underline; }
        /* Unified button styles */
        .history-btn, .back-btn {
            display: inline-block;
            font-family: inherit;
            font-size: 1em;
            font-weight: 500;
            padding: 8px 18px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            margin: 20px 5px 0 0;
            text-decoration: none;
            transition: background 0.15s, color 0.15s, box-shadow 0.15s;
            vertical-align: middle;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .back-btn {
            background: #007bff;
            color: #fff;
            border: 1px solid #007bff;
        }
        .back-btn:hover {
            background: #0056b3;
            color: #fff;
        }
        .history-btn {
            background: #f8f9fa;
            color: #333;
            border: 1px solid #bbb;
        }
        .history-btn:hover {
            background: #e2e6ea;
            color: #222;
        }
        .history-btn.download {
            background: #e2e6ea;
            color: #2563eb;
            border: 1px solid #2563eb;
        }
        .history-btn.download:hover {
            background: #dbeafe;
            color: #1e40af;
        }
        .history-btn.clear {
            background: #dc3545;
            color: #fff;
            border: 1px solid #b71c1c;
        }
        .history-btn.clear:hover {
            background: #b71c1c;
            color: #fff;
        }
        .crc32-badge { font-family: inherit; font-size: 0.95em; background: #e0e7ff; color: #3730a3; border-radius: 4px; padding: 2px 6px; margin-right: 6px; }
    </style>
</head>
<body>
    <h1>Screenshot History Files</h1>
    <div style="text-align:center; margin-bottom:18px;">
        <a class="back-btn" href="/">← Back to Gallery</a>
        <button class="history-btn" onclick="location.reload()">🔄 Refresh</button>
        <button class="history-btn download" onclick="window.location.href='/download-history-zip'">⬇️ Download History (ZIP)</button>
        <button class="history-btn clear" id="clearHistoryBtn">🗑️ Clear History</button>
    </div>
    <div style="background:#fffbe6; color:#856404; border:1px solid #ffeeba; border-radius:6px; padding:12px; margin-bottom:18px; font-size:1em;">
        <strong>Note:</strong> The <code>enableScreenshotHistory</code> setting must be enabled in your config for history content to be collected and displayed here.
    </div>
    <table class="history-table">
        <thead>
            <tr><th>Filename</th><th>Type</th><th>Timestamp</th><th>CRC32</th><th>View</th></tr>
        </thead>
        <tbody>
            ${rows.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#888;">No history files found.</td></tr>' : rows.map((f, i) => `
                <tr style="background:${palette[f.runIdx % palette.length]};">
                    <td style="font-family:inherit;">${f.filename}</td>
                    <td class="type-${f.type}">${f.type.charAt(0).toUpperCase() + f.type.slice(1)}</td>
                    <td>${f.timestamp}</td>
                    <td><span class="crc32-badge">${f.crc32}</span></td>
                      <td><a class="view-link" href="/history-files/${encodeURIComponent(f.filename)}" target="_blank">View</a></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <script>
        document.getElementById('clearHistoryBtn').onclick = async function() {
            if (!confirm('Are you sure you want to clear all history files? This cannot be undone.')) return;
            try {
                const resp = await fetch('/clear-history', { method: 'POST' });
                const result = await resp.json();
                if (result.success) {
                    alert('History cleared: ' + result.deleted + ' files deleted.');
                    location.reload();
                } else {
                    alert('Error clearing history: ' + (result.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Error clearing history: ' + e.message);
            }
        };
    </script>
</body>
</html>
`;
            res.send(html);
        } catch (error) {
            res.status(500).send('Error loading history files');
        }
    });

    // Endpoint to clear all history files
    app.post('/clear-history', async (req, res) => {
        try {
            const files = await fs.readdir(SCREENSHOT_HISTORY_PATH);
            let deleted = 0;
            for (const file of files) {
                await fs.remove(require('path').join(SCREENSHOT_HISTORY_PATH, file));
                deleted++;
            }
            res.json({ success: true, deleted });
        } catch (error) {
            console.error('❌ Error clearing history:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Endpoint to download zipped history folder
    app.get('/download-history-zip', async (req, res) => {
        try {
            // Set headers for zip download
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="screenshot-history.zip"');

            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', err => {
                console.error('❌ Error creating zip:', err.message);
                res.status(500).send('Error creating zip file');
            });
            archive.pipe(res);
            archive.directory(SCREENSHOT_HISTORY_PATH, false);
            await archive.finalize();
        } catch (error) {
            console.error('❌ Error zipping history:', error.message);
            res.status(500).send('Error creating zip file');
        }
    });
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
        .filter(file => !file.endsWith('.crc32') && file.endsWith('.png') && !file.endsWith('_temp.png'))
        .sort();
      
      // Get current CRC32 values
      const checksums = getAllCurrentCRC32();
      
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
        .screenshot-crc32 {
            color: #28a745;
            font-size: 0.85em;
            font-family: 'Courier New', monospace;
            margin-top: 8px;
            padding: 4px 8px;
            background-color: #f8f9fa;
            border-radius: 3px;
            display: inline-block;
        }
        .history-btn {
            background-color: #17a2b8;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85em;
            margin-top: 8px;
        }
        .history-btn:hover {
            background-color: #138496;
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

        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: #fefefe;
            margin: 5% auto;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-header h2 {
            margin: 0;
            color: #333;
        }
        .close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover {
            color: #000;
        }
        .history-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .history-table th,
        .history-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .history-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        .history-table tr.history-row {
            position: relative;
            transition: background-color 0.2s ease;
        }
        .history-table tr.history-row::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 6px;
            border-radius: 4px 0 0 4px;
            background: var(--history-stripe, #2563eb);
        }
        .history-table tr.history-row--changed {
            font-weight: 600;
            background-color: rgba(0, 0, 0, 0.04);
        }
        .history-table tr.history-row--repeat {
            opacity: 0.6;
        }
        .history-table td.crc32-value {
            font-family: 'Courier New', monospace;
            color: #28a745;
        }
        .history-table td.timestamp {
            color: #666;
            font-size: 0.9em;
        }
        .history-table .timestamp-main {
            color: #333;
            font-weight: 500;
        }
        .history-table .timestamp-range {
            font-size: 0.85em;
            color: #555;
            margin-top: 4px;
        }
        .history-table .history-badge {
            display: inline-block;
            margin-right: 8px;
            padding: 2px 6px;
            font-size: 0.7em;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: #1d4ed8;
            background-color: rgba(37, 99, 235, 0.12);
            border-radius: 999px;
        }
        .history-table tr.history-row--repeat .crc32-value {
            color: #1f9d5d;
        }
        .history-table tr.history-row--repeat .history-badge {
            display: none;
        }
        .history-run-0 { --history-stripe: #2563eb; }
        .history-run-1 { --history-stripe: #059669; }
        .history-run-2 { --history-stripe: #7c3aed; }
        .history-run-3 { --history-stripe: #d97706; }
        .history-run-4 { --history-stripe: #dc2626; }
        .no-history {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        .history-stats {
            background-color: #e7f3ff;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 HA Screenshotter Gallery</h1>
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        <button class="history-btn" onclick="window.location.href='/history'" style="margin-left:10px; background-color:#6c757d;">📁 View History Files</button>
    </div>
    
    <div class="info">
        <h3>Configuration</h3>
        <p><strong>Schedule:</strong> ${config.schedule}</p>
        <p><strong>URLs:</strong> ${config.urls.length} configured</p>
        <p><strong>Resolution:</strong> ${config.resolution_width}x${config.resolution_height}</p>
        <p><strong>Last Update:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="gallery">
        ${imageFiles.map((file, index) => {
          const screenshotIndex = parseInt(file.replace('.png', ''));
          const checksumData = checksums[screenshotIndex];
          const crc32Display = checksumData ? 
            `<div class="screenshot-crc32">CRC32: ${checksumData.crc32}</div>
             <button class="history-btn" onclick="showHistory(${screenshotIndex})">📊 View History (${checksumData.historyCount})</button>` : 
            '<div class="screenshot-crc32">CRC32: Not available</div>';
          
          return `
            <div class="screenshot-card">
                <img src="/screenshots/${file}" alt="Screenshot ${index + 1}" onclick="window.open('/screenshots/${file}', '_blank')">
                <div class="screenshot-info">
                    <div class="screenshot-name">Screenshot ${screenshotIndex}</div>
                    <div class="screenshot-time">File: ${file}</div>
                    ${crc32Display}
                </div>
            </div>
        `;
        }).join('')}
    </div>
    
    ${imageFiles.length === 0 ? '<p style="text-align: center; color: #666; font-size: 1.2em;">No screenshots found. Screenshots will appear here once they are generated.</p>' : ''}
    
    <!-- Modal for history -->
    <div id="historyModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>CRC32 History</h2>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div id="historyContent">Loading...</div>
        </div>
    </div>
    
    <script>
        document.getElementById('clearHistoryBtn').onclick = async function() {
            if (!confirm('Are you sure you want to clear all history files? This cannot be undone.')) return;
            try {
                const resp = await fetch('/clear-history', { method: 'POST' });
                const result = await resp.json();
                if (result.success) {
                    alert('History cleared: ' + result.deleted + ' files deleted.');
                    location.reload();
                } else {
                    alert('Error clearing history: ' + (result.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Error clearing history: ' + e.message);
            }
        };
        // Auto-refresh every 60 seconds
        setInterval(() => {
            location.reload();
        }, 60000);
        
        async function showHistory(index) {
            const modal = document.getElementById('historyModal');
            const content = document.getElementById('historyContent');
            modal.style.display = 'block';
            content.innerHTML = 'Loading...';
            
            try {
                const response = await fetch('/checksums/' + index);
                const data = await response.json();
                
                if (data.history && data.history.length > 0) {
                    let html = '<div class="history-stats">';
                    html += '<p><strong>Screenshot Index:</strong> ' + data.screenshot_index + '</p>';
                    html += '<p><strong>Total Entries:</strong> ' + data.count + ' / ' + data.max_length + '</p>';
                    html += '<p><strong>Retrieved:</strong> ' + new Date(data.timestamp).toLocaleString() + '</p>';
                    html += '</div>';
                    
                    html += '<table class="history-table">';
                    html += '<thead><tr><th>#</th><th>Timestamp</th><th>CRC32</th></tr></thead>';
                    html += '<tbody>';
                    
                    // Show most recent first
                    const reversedHistory = [...data.history].reverse();
                    const runs = [];
                    reversedHistory.forEach((entry) => {
                        const lastRun = runs[runs.length - 1];
                        if (!lastRun || lastRun.crc32 !== entry.crc32) {
                            runs.push({ crc32: entry.crc32, entries: [entry] });
                        } else {
                            lastRun.entries.push(entry);
                        }
                    });

                    const stripePaletteSize = 5;
                    let displayIndex = data.count;

                    runs.forEach((run, runIdx) => {
                        const colorClass = 'history-run-' + (runIdx % stripePaletteSize);
                        const latestTimestamp = new Date(run.entries[0].timestamp);
                        const oldestTimestamp = new Date(run.entries[run.entries.length - 1].timestamp);
                        const hasRange = run.entries.length > 1;

                        run.entries.forEach((entry, entryIdx) => {
                            const rowType = entryIdx === 0 ? 'history-row--changed' : 'history-row--repeat';
                            html += '<tr class="history-row ' + rowType + ' ' + colorClass + '">';
                            html += '<td>' + displayIndex + '</td>';

                            html += '<td class="timestamp">';
                            html += '<div class="timestamp-main">' + new Date(entry.timestamp).toLocaleString() + '</div>';
                            if (entryIdx === 0 && hasRange) {
                                html += '<div class="timestamp-range">Spanned ' + latestTimestamp.toLocaleString() + ' → ' + oldestTimestamp.toLocaleString() + ' · ' + run.entries.length + ' entr' + (run.entries.length === 1 ? 'y' : 'ies') + '</div>';
                            }
                            html += '</td>';

                            html += '<td class="crc32-value">';
                            if (entryIdx === 0) {
                                html += '<span class="history-badge">Changed</span>';
                            }
                            html += entry.crc32;
                            html += '</td>';

                            html += '</tr>';
                            displayIndex--;
                        });
                    });
                    
                    html += '</tbody></table>';
                    content.innerHTML = html;
                } else {
                    content.innerHTML = '<div class="no-history">No history available for this screenshot yet.</div>';
                }
            } catch (error) {
                content.innerHTML = '<div class="no-history">Error loading history: ' + error.message + '</div>';
            }
        }
        
        function closeModal() {
            document.getElementById('historyModal').style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('historyModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
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
  
  // Get all current CRC32 values
  app.get('/checksums', (req, res) => {
    try {
      const checksums = getAllCurrentCRC32();
      res.json({
        checksums,
        timestamp: new Date().toISOString(),
        history_length: HISTORY_LENGTH
      });
    } catch (error) {
      console.error('❌ Error getting checksums:', error.message);
      res.status(500).json({ error: 'Failed to retrieve checksums' });
    }
  });
  
  // Get full history for a specific screenshot
  app.get('/checksums/:index', (req, res) => {
    try {
      const index = parseInt(req.params.index);
      if (isNaN(index) || index < 0) {
        return res.status(400).json({ error: 'Invalid screenshot index' });
      }
      
      const history = getHistory(index);
      res.json({
        screenshot_index: index,
        history,
        count: history.length,
        max_length: HISTORY_LENGTH,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting checksum history:', error.message);
      res.status(500).json({ error: 'Failed to retrieve checksum history' });
    }
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
