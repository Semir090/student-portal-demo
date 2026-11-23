const http = require('http');
const crypto = require('crypto');

const submissions = [];
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Student Portal</title>
<style>
* { box-sizing: border-box; }
body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: Arial, sans-serif;
    background: #0f172a;
    color: white;
}
.container {
    width: 100%;
    max-width: 400px;
    padding: 35px 25px;
    text-align: center;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 20px;
}
.logo {
    width: 65px;
    height: 65px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: #2563eb;
    font-size: 22px;
    font-weight: bold;
}
h1 { font-size: 27px; }
.subtitle { color: #94a3b8; font-size: 14px; line-height: 1.6; }
input {
    width: 100%;
    padding: 15px;
    margin: 15px 0;
    border: 1px solid #475569;
    border-radius: 10px;
    background: #0f172a;
    color: white;
    font-size: 15px;
}
button {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 10px;
    background: #2563eb;
    color: white;
    font-size: 16px;
    font-weight: bold;
}
#result { margin-top: 20px; color: #4ade80; }
.notice {
    margin-top: 28px;
    padding: 12px;
    border-radius: 8px;
    background: #422006;
    color: #fbbf24;
    font-size: 12px;
    line-height: 1.5;
}
.footer { margin-top: 22px; color: #64748b; font-size: 11px; }
</style>
</head>
<body>
<div class="container">
    <div class="logo">SP</div>
    <h1>Student Portal</h1>
    <p class="subtitle">
        Welcome to our educational demonstration.
        Explore how websites communicate with servers.
    </p>

    <form id="demoForm">
        <input type="text" id="username"
        placeholder="Enter a fictional username"
        maxlength="40" autocomplete="off" required>
        <button id="submitButton" type="submit">Continue</button>
    </form>

    <p id="result" aria-live="polite"></p>

    <div class="notice">
        Educational demonstration only.
        Submitted fictional usernames are recorded for this project.
        Do not enter real names, passwords or personal information.
    </div>

    <div class="footer">
        Student Portal | Cybersecurity School Project
    </div>
</div>

<script>
const form = document.getElementById('demoForm');
const result = document.getElementById('result');
const button = document.getElementById('submitButton');

form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();

    if (!username) return;

    button.disabled = true;
    button.textContent = 'Sending...';

    try {
        const response = await fetch('/demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        result.textContent = await response.text();

    } catch {
        result.textContent = 'Could not contact the server. Try again.';
    }

    button.disabled = false;
    button.textContent = 'Continue';
});
</script>
</body>
</html>
`;

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function authorized(req) {
    if (!ADMIN_PASSWORD) return false;

    const header = req.headers.authorization || '';
    if (!header.startsWith('Basic ')) return false;

    let credentials;

    try {
        credentials = Buffer.from(header.slice(6), 'base64').toString();
    } catch {
        return false;
    }

    const separator = credentials.indexOf(':');
    if (separator < 0) return false;

    const password = credentials.slice(separator + 1);

    const a = Buffer.from(password);
    const b = Buffer.from(ADMIN_PASSWORD);

    return a.length === b.length &&
        crypto.timingSafeEqual(a, b);
}

const server = http.createServer((req, res) => {

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });
        return res.end(html);
    }

    if (req.method === 'POST' && req.url === '/demo') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1000) {
                req.destroy();
            }
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);

                if (
                    typeof data.username !== 'string' ||
                    !data.username.trim() ||
                    data.username.trim().length > 40
                ) {
                    res.writeHead(400);
                    return res.end('Invalid fictional username.');
                }

                const username = data.username.trim();

                submissions.push({
                    username,
                    time: new Date().toISOString()
                });

                if (submissions.length > 100) {
                    submissions.shift();
                }

                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });

                res.end(
                    'Hello, ' + username +
                    '! Your fictional username was received.'
                );

            } catch {
                res.writeHead(400);
                res.end('Invalid request.');
            }
        });

        return;
    }

    if (req.method === 'GET' && req.url === '/admin') {

        if (!ADMIN_PASSWORD) {
            res.writeHead(503);
            return res.end('Admin password is not configured.');
        }

        if (!authorized(req)) {
            res.writeHead(401, {
                'WWW-Authenticate': 'Basic realm="Student Portal Admin"'
            });
            return res.end('Admin login required.');
        }

        const rows = submissions.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(item.username)}</td>
                <td>${escapeHTML(item.time)}</td>
            </tr>
        `).join('');

        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });

        return res.end(`
            <!DOCTYPE html>
            <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Admin Dashboard</title>
            <style>
            body {
                background:#0f172a;color:white;
                font-family:Arial;padding:20px;
            }
            h1 { color:#60a5fa; }
            table {
                width:100%;border-collapse:collapse;
                background:#1e293b;
            }
            th,td {
                padding:12px;text-align:left;
                border-bottom:1px solid #475569;
                overflow-wrap:anywhere;
            }
            </style>
            </head>
            <body>
            <h1>Student Portal Admin</h1>
            <p>Total submissions: ${submissions.length}</p>
            <table>
            <tr><th>No.</th><th>Fictional username</th><th>Time</th></tr>
            ${rows || '<tr><td colspan="3">No submissions yet.</td></tr>'}
            </table>
            </body>
            </html>
        `);
    }

    res.writeHead(404);
    res.end('Page not found');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('Student Portal is running!');
});
