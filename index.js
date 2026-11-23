const http = require('http');

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Student Portal</title>

<style>
* {
    box-sizing: border-box;
}

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
    box-shadow: 0 15px 40px rgba(0,0,0,0.3);
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

h1 {
    font-size: 27px;
    margin: 0 0 10px;
}

.subtitle {
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 30px;
}

input {
    width: 100%;
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid #475569;
    border-radius: 10px;
    background: #0f172a;
    color: white;
    font-size: 15px;
    outline: none;
}

input:focus {
    border-color: #3b82f6;
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
    cursor: pointer;
}

button:disabled {
    opacity: 0.6;
}

#result {
    margin-top: 20px;
    font-size: 14px;
    line-height: 1.5;
    color: #4ade80;
}

.notice {
    margin-top: 28px;
    padding: 12px;
    border-radius: 8px;
    background: #422006;
    color: #fbbf24;
    font-size: 12px;
    line-height: 1.5;
}

.footer {
    margin-top: 22px;
    color: #64748b;
    font-size: 11px;
}
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
        <input
            type="text"
            id="username"
            placeholder="Enter a fictional username"
            maxlength="40"
            autocomplete="off"
            required
        >

        <button id="submitButton" type="submit">
            Continue
        </button>
    </form>

    <p id="result" aria-live="polite"></p>

    <div class="notice">
        Educational demonstration only.
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

    if (!username) {
        result.textContent = 'Please enter a fictional username.';
        return;
    }

    button.disabled = true;
    button.textContent = 'Sending...';
    result.textContent = '';

    try {
        const response = await fetch('/demo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const message = await response.text();

        result.textContent = message;

    } catch (error) {
        result.textContent = 'Could not contact the server. Try again.';
    }

    button.disabled = false;
    button.textContent = 'Continue';
});
</script>

</body>
</html>
`;

const server = http.createServer((req, res) => {

    if (req.method === 'GET' && req.url === '/') {

        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });

        res.end(html);

    } else if (req.method === 'POST' && req.url === '/demo') {

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
                    data.username.length > 40
                ) {
                    res.writeHead(400);
                    return res.end('Invalid fictional username.');
                }

                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });

                res.end(
                    'Hello, ' + data.username.trim() +
                    '! The server received your username.'
                );

            } catch {
                res.writeHead(400);
                res.end('Invalid request.');
            }
        });

    } else {
        res.writeHead(404);
        res.end('Page not found');
    }
});

server.listen(3000, () => {
    console.log('Student Portal is running!');
});
