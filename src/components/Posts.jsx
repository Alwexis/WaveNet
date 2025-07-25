import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

import Post from "./Post";

export default function Posts({ refresh, onRefreshComplete }) {
    const { user, firebaseUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const getPosts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`https://wavenet.up.railway.app/posts/?user=public-friends`,
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
    }

    useEffect(() => {
        getPosts();
    }, [, refresh]);

    const handlePostLike = async (postId) => {
        const response = await fetch(`https://wavenet.up.railway.app/like/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseUser.accessToken}`,
            },
            body: JSON.stringify({ type: "posts", id: postId }),
        });
        const _didLike = await response.json();
        if (_didLike.status == "success") {
            setPosts((prevPosts) => {
                return prevPosts.map((post) => {
                    if (post.id === postId) {
                        if (_didLike.action === "like") {
                            return { ...post, likes: [...post.likes, user.uid] };
                        } else {
                            return {
                                ...post,
                                likes: post.likes.filter((like) => like !== user.uid),
                            };
                        }
                    }
                    return post;
                });
            });
        }
        console.log(_didLike);
    };

    return (
        <div className="space-y-4 w-full md:max-h-[60vh] md:overflow-y-auto">
            {
                loading ? (
                    <p className="text-center">Loading posts...</p>
                ) : (
                    posts.length > 0 ? (
                        posts.map((post) => (
                            <Post
                                key={post.id}
                                post={post}
                                showAuthor={true}
                                onPostLike={handlePostLike}
                            />
                        ))
                    ) : (
                        <p className="text-center">
                            No posts found :[. Try linking some friends!
                        </p>
                    )
                )
            }
        </div>
    );
}
