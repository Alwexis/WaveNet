import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function CreatePostModal({ isOpen, onClose }) {
    const { user, firebaseUser } = useAuth();
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [formDisabled, setFormDisabled] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const validateField = (el, name, value) => {
        let error = "";
        if (name === "title" && value.length < 2 && value.length > 0) {
            error = "Post Title must have at least 2 characters.";
            el.dataset.invalid = true;
        } else if (
            name === "content" &&
            (value.length < 10 || value.length > 256) &&
            value.length > 0
        ) {
            error = "Content must have between 10 and 256 characters.";
            el.dataset.invalid = true;
        } else {
            el.dataset.invalid = null;
        }

        setErrors({ ...errors, [name]: error });
    };

    useEffect(() => {
        if (Object.values(errors).every((err) => err === "")) {
            setFormDisabled(false);
        } else {
            setFormDisabled(true);
        }
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateField(e.target, name, value);
    };

    const handleFilesChange = (e) => {
        const { name, files } = e.target;
        let _files = [];
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        for (const file of files) {
            if (file.size <= MAX_FILE_SIZE && _files.length < 3) {
                _files.push(file);
            }
        }
        setFormData({ ...formData, [name]: _files });
    };

    const openFilePicker = () => {
        document.getElementById("files").value = null;
        setFormData({ ...formData, files: [] });
        document.getElementById("files").click();
    };

    const removeFile = (file) => {
        setFormData({
            ...formData,
            files: formData.files.filter((f) => f.name !== file.name),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isUploading) return;
        setIsUploading(true);
        const form = new FormData();
        form.append("title", formData.title);
        form.append("content", formData.content);
        if (formData.files) {
            for (const file of formData.files) {
                form.append("files", file);
            }
        }
        try {
            const response = await fetch("https://wavenet.up.railway.app/create-post/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${firebaseUser.accessToken}`,
                },
                body: form,
            });
            const data = await response.json();
            setIsUploading(false);
            if (data.status == "success") {
                onClose("success", "");
            } else {
                onClose("error", data.message);
            }
        } catch (error) {
            setIsUploading(false);
            console.error("Error creating post:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-40 max-h-screen">
            <div className="bg-white border-2 border-black p-6 h-fit w-full max-w-md shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-bold mb-4">Create Post</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block font-bold mb-1">
                            Title:
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            onChange={handleChange}
                            className="w-full px-3 py-2 border-2 border-black bg-gray-100 data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 transition-all outline-none"
                            required
                        />
                        {errors.title && (
                            <p className="text-red-400 text-sm mt-1">
                                {errors.title}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="content"
                            className="block font-bold mb-1"
                        >
                            Content:
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            onChange={handleChange}
                            className="w-full px-3 py-2 border-2 border-black bg-gray-100 h-32 resize-none data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 transition-all outline-none"
                            required
                        ></textarea>
                        {errors.content && (
                            <p className="text-red-400 text-sm mt-1">
                                {errors.content}
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="files" className="block font-bold mb-1">
                            Files:
                        </label>
                        {formData.files?.length > 0 && (
                            <ul className="space-y-2 my-2">
                                {Array.from(formData.files).map((file) => (
                                    <li
                                        key={file.name}
                                        className="flex items-center space-x-2"
                                    >
                                        <span>{file.name}</span>
                                        <button
                                            disabled={isUploading}
                                            type="button"
                                            className="text-red-500 hover:text-red-400 disabled:bg-red-400 disabled:cursor-not-allowed transition-all cursor-pointer"
                                            onClick={() => removeFile(file)}
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button
                            disabled={isUploading}
                            onClick={() => openFilePicker()}
                            type="button"
                            className="text-xs md:text-sm w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 border-b-2 border-blue-700 hover:border-blue-800 active:border-t-2 active:border-b-0 transition-all duration-100 cursor-pointer"
                        >
                            Add files (3 Files of 10mb max)
                        </button>
                        <input
                            multiple
                            max={3}
                            onChange={handleFilesChange}
                            type="file"
                            accept="image/jpg, image/png"
                            id="files"
                            name="files"
                            className="hidden"
                        />
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isUploading || formDisabled}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 border-b-2 border-green-700 hover:border-green-800 active:border-t-2 active:border-b-0 transition-all duration-100 cursor-pointer"
                        >
                            {isUploading ? "Uploading..." : "Create Post"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                              onClose("cancel", "")
                              setErrors({})
                              setFormData({})
                            }}
                            disabled={isUploading}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 border-b-2 border-red-700 hover:border-red-800 active:border-t-2 active:border-b-0 transition-all duration-100 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
