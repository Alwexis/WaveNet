import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "../firebase";
import { useNavigate } from 'react-router-dom';

// Crear un contexto
const AuthContext = createContext();

// Proveedor de contexto para envolver la aplicación
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLikes, setUserLikes] = useState(0);
    const [chats, setChats] = useState([]);

    const getChats = async (accessToken) => {
        if (!accessToken) return;
        const _ = await fetch("https://wavenet.up.railway.app/chats", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            }
        });
        const r = await _.json();
        if (r.status == "success") {
            setChats(JSON.parse(r.result));
        } else {
            setChats([]);
        }
    };

    const refreshChats = async () => {
        await getChats(firebaseUser.accessToken);
    }

    const getUserLikes = async (accessToken) => {
        const _ = await fetch("https://wavenet.up.railway.app/likes/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            }
        });
        const r = await _.json();
        setUserLikes(r.likes);
    }

    /*
    const getFriends = async (accessToken) => {
        const _ = await fetch("https://wavenet.up.railway.app/friends", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            }
        });
        const r = await _.json();
        setFriends(JSON.parse(r.friends));
        setLastMessages(JSON.parse(r.last_messages));
    }
    */

    const refreshUser = async () => {
        const _ = await fetch("https://wavenet.up.railway.app/auth/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseUser.accessToken}`,
            }
        });
        const r = await _.json();
        if (r.user) {
            getUserLikes(firebaseUser.accessToken);
            getChats(firebaseUser.accessToken);
            setUser(r.user);
        }
    };

    const logout = async () => {
        await auth.signOut();
        setUser(null);
        setFirebaseUser(null);
        setLoading(true);
    };

    useEffect(() => {
        // Establece el listener para el cambio de estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setUser(null);
                setFirebaseUser(null);
                setLoading(false); // Dejar de cargar si no hay usuario
                navigate("/login");
                return;
            }
            try {
                const _ = await fetch("https://wavenet.up.railway.app/auth/user", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.accessToken}`,
                    }
                });
                const r = await _.json();
                if (r.user) {
                    setUser(r.user);
                    setFirebaseUser(user);
                    getUserLikes(user.accessToken);
                    getChats(user.accessToken);
                    setLoading(false);
                }
            } catch (error) {
                navigate("/login");
            }
        });

        // Limpieza del listener
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, firebaseUser, userLikes, chats, loading, logout, refreshUser, refreshChats }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para acceder al contexto
export const useAuth = () => {
    return useContext(AuthContext);
};
