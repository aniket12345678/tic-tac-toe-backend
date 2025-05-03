import express from 'express';
import 'dotenv/config';
import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = process.env.PORT || 5000;
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
    },
});

const rooms: Record<string, string[]> = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId: string) => {
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        if (rooms[roomId].length >= 2) {
            socket.emit('room_full');
            return;
        }

        rooms[roomId].push(socket.id);
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        io.to(roomId).emit('room_users', rooms[roomId]);
    });

    socket.on('move', ({ roomId, key, symbol }) => {
        io.to(roomId).emit('next_player_turn', { key, symbol });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            } else {
                io.to(roomId).emit('room_users', rooms[roomId]);
            }
        }
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to backend' });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
