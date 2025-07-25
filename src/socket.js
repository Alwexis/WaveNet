import { io } from "socket.io-client";

const SOCKET_URL = "https://wavenet.up.railway.app/"; // Correcto
const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Forzar WebSocket
  autoConnect: true,
  reconnectionAttempts: 5, // Intenta reconectar 5 veces
});

export default socket;
