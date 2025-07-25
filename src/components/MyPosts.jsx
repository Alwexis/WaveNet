import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import Post from "./Post";
import ConfirmModal from "./ConfirmModal";

export default function MyPosts({ refresh, onRefreshComplete, onNotification }) {
    const { user, firebaseUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeletePost, setConfirmDeletePost] = useState(false);
    const [postBeingDeleted, setPostBeingDeleted] = useState(null);

    const getPosts = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://wavenet.up.railway.app/posts/?user=${user.uid}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${firebaseUser.accessToken}`,
                    },
                }
            );
            const _posts = await response.json();
            const _realPosts = JSON.parse(_posts.result);
            setPosts(_realPosts);
            onRefreshComplete();
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getPosts();
    }, [, refresh]);

    const handlePostDelete = (postId) => {
        console.log("Deleting post with id:", postId);
        setConfirmDeletePost(true);
        setPostBeingDeleted(postId);
    };

    const onPostDelete = async () => {
        try {
            const _r = await fetch(`https://wavenet.up.railway.app/post/${postBeingDeleted}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${firebaseUser.accessToken}`,
                },
            });
            const _res = await _r.json();
            if (_res.status === "success") {
                onNotification("Post deleted successfully! :]");
            } else {
                onNotification(`Failed to delete post: ${_res.message}`);
            }
            getPosts();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-4 w-full md:max-h-[60vh] md:overflow-y-auto">
            {loading ? (
                <p className="text-center">Loading posts...</p>
            ) : (
                    posts.length > 0 ? (
                        posts.map((post) => (
                            <Post
                                key={post.id}
                                post={post}
                                showAuthor={false}
                                isSelfPost={true}
                                onPostDelete={handlePostDelete}
                            />
                        ))
                    ) : (
                        <p className="text-center">No posts found. Why don't you try to post some? :]</p>
                    )
            )}
            <ConfirmModal isOpen={confirmDeletePost} onClose={() => setConfirmDeletePost(false)} onConfirm={onPostDelete} message="Are you sure you want to delete this post? This is irreversible!" />
        </div>
    );
}
