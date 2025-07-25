import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import socket from "../socket";

export default function ChatInterface({ chat, onBack }) {
    const [messages, setMessages] = useState([]);

    const { user, firebaseUser } = useAuth();
    const [formData, setFormData] = useState({});
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!chat.id || !user.uid) return; 
        
        if (socket.connected) {
            console.log(`Conectado con ID: ${socket.id}`);
            socket.emit("join_room", { room: chat.id, uid: user.uid });
        } else {
            console.error("Socket no está conectado");
        }
        
        // Listener de conexión
        socket.on("connect", () => {
            console.log(`Conectado con ID: ${socket.id}`);
            socket.emit("join_room", { room: chat.id, uid: user.uid });
        });

        socket.on("message", (data) => {
            const _message = JSON.parse(data.message);
            setMessages((prevMessages) => [...prevMessages, _message]);
        });
    
        socket.on("error", (data) => {
            console.error(data);
        });

        const fetchMessages = async () => {
            setLoadingMessages(true);
            const _ = await fetch(
                `https://wavenet.up.railway.app/messages/${chat.id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${firebaseUser.accessToken}`,
                    },
                }
            );
            const r = await _.json();
            const messages = JSON.parse(r.result);
            if (!messages) {
                setMessages([]);
            } else {
                setMessages(messages);
            }
            setLoadingMessages(false);
        };
        
        fetchMessages();

        return () => {
            socket.emit("leave_room", { room: chat.id });
            socket.off("connect");
            socket.off("message");
            socket.off("error");
        };
    }, [chat.id, user.uid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.content === "") return;
        setSending(true);
        if (formData.attachment) {
            const reader = new FileReader();
            reader.onloadend = () => {
                socket.emit("send_message", {
                    room: chat.id,
                    content: formData.message,
                    file_content: reader.result, // ArrayBuffer
                    user: user.uid
                });
                setFormData(null);
                document.getElementById("attachment").value = null;
                document.getElementById("message").value = "";
            };
            reader.readAsArrayBuffer(formData.attachment);
        } else {
            socket.emit("send_message", {
                room: chat.id,
                content: formData.message,
                user: user.uid
            });
            setFormData(null);
            document.getElementById("message").value = "";
        }
        setSending(false);
    };

    const handleAttachment = (e) => {
        const file = e.target.files[0];
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size <= MAX_FILE_SIZE) {
            setFormData({ ...formData, attachment: file });
            e.target.value = null;
            e.target.files = null;
        }
    };

    const handleDeleteAttachment = () => {
        setFormData({ ...formData, attachment: null });
        document.getElementById("attachment").value = null;
    };

    return (
        <div className="flex flex-col max-h-[60vh] min-h-[60vh]">
            <div className="bg-blue-500 text-white p-2 flex items-center">
                <button
                    onClick={onBack}
                    className="mr-4 font-bold py-2 px-4 border-2 border-white hover:bg-blue-600 transition-colors cursor-pointer"
                >
                    Back
                </button>
                <h2 className="text-xl font-bold flex-grow text-center">
                    {
                        chat.users.filter((u) => u.uid !== user.uid)[0].name
                    }
                </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 h-full min-h-full">
                {loadingMessages ? (
                    <p>Loading messages...</p>
                ) : (
                    messages.length > 0 && messages &&
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.user.uid == user.uid
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[70%] flex flex-col p-2 rounded-lg ${
                                    message.user.uid == user.uid
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200"
                                }`}
                            >
                                <p>{message.content}</p>
                                {message.files && (
                                    <div className="mt-2">
                                        <img
                                            src={message.files}
                                            alt="Attached image"
                                            className="max-w-32 max-h-32 object-contain rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <form
                onSubmit={handleSubmit}
                className="p-4 bg-gray-100 flex items-center space-x-2"
            >
                <label className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 border-2 border-black">
                    📎
                    <input
                        type="file"
                        id="attachment"
                        name="attachment"
                        className="hidden"
                        onChange={handleAttachment}
                        accept="image/jpg, image/jpeg, image/png"
                    />
                </label>
                <input
                    type="text"
                    id="message"
                    name="message"
                    onChange={handleChange}
                    placeholder="Type a message..."
                    className="flex-grow w-32 px-3 py-2 border-2 border-black bg-white"
                />
                <button
                    type="submit"
                    disabled={sending}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 border-2 border-black cursor-pointer"
                >
                    {
                        sending ? "Sending..." : "Send"
                    }
                </button>
            </form>
            {formData && formData.attachment && (
                <div className="flex items-center space-x-4 px-4 py-2 bg-gray-200">
                    <p className="text-sm truncate max-w-72">Attached: {formData.attachment.name}</p>
                    <span onClick={handleDeleteAttachment} className="text-sm text-red-400 cursor-pointer">Delete attachment</span>
                </div>
            )}
        </div>
    );
}
