import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function EditProfileModal({ isOpen, onClose }) {
    const { user, firebaseUser, refreshUser } = useAuth();
    const [formData, setFormData] = useState({ username: user.username, public_profile: user.public_profile, profile_picture: user.profile_picture });
    const [isEditing, setIsEditing] = useState(false);
    const [pfp, setPfp] = useState(user.profile_picture);
    const [errors, setErrors] = useState({});
    const [formDisabled, setFormDisabled] = useState(true);

    const validateField = (el, name, value) => {
        let error = "";
        if (
            name === "username" &&
            (value.length < 3 || value.includes(" ")) &&
            value.length > 0
        ) {
            error = "Username must have at least 3 characters with no spaces.";
            el.dataset.invalid = true;
        } else if (name === "password" && value.length < 6 && value.length > 0) {
            error = "Password must have at least 6 characters.";
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
        const { name } = e.target;
        const file = e.target.files[0];
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size <= MAX_FILE_SIZE) {
            setFormData({ ...formData, [name]: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPfp(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePfp = () => {
        setFormData({ ...formData, profile_picture: "/no_pfp.webp" });
        setPfp("/no_pfp.webp");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditing) return;
        setIsEditing(true);
        const form = new FormData();
        form.append("username", formData.username);
        form.append("public_profile", formData.public_profile);
        if (formData.profile_picture != "/no_pfp.webp") {
            form.append("file", formData.profile_picture);
        }
        try {
            const response = await fetch("https://wavenet.up.railway.app/auth/user/", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${firebaseUser.accessToken}`,
                },
                body: form,
            });
            const data = await response.json();
            console.log(data);
            setIsEditing(false);
            if (data.status == "success") {
                onClose("success", "");
                refreshUser();
            } else {
                onClose("error", data.message);
            }
        } catch (error) {
            setIsEditing(false);
            console.error("Error creating post:", error);
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-black p-6 w-full max-w-md shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center mb-4">
                        <div className="w-24 h-24 border-2 border-black relative overflow-hidden">
                            <img
                                src={pfp}
                                alt="Profile"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 border-b-2 border-blue-700 hover:border-blue-800 active:border-t-2 active:border-b-0 transition-all duration-100">
                                Change Photo
                                <input
                                    type="file"
                                    name="profile_picture"
                                    className="hidden"
                                    onChange={handleFilesChange}
                                    accept="image/*"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={handleRemovePfp}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 border-b-2 border-red-700 hover:border-red-800 active:border-t-2 active:border-b-0 transition-all duration-100 cursor-pointer"
                            >
                                Delete Photo
                            </button>
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="username"
                            className="block font-bold mb-1"
                        >
                            Username:
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            onChange={handleChange}
                            className="w-full px-3 py-2 border-2 border-black bg-gray-100 data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 transition-all outline-none"
                        />
                        {
                            errors.username && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.username}
                                </p>
                            )
                        }
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block font-bold mb-1"
                        >
                            New Password:
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            onChange={handleChange}
                            className="w-full px-3 py-2 border-2 border-black bg-gray-100 data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 transition-all outline-none"
                        />
                        {
                            errors.password && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )
                        }
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold">Profile Visibility:</span>
                        <button
                            type="button"
                            onClick={() =>
                                setFormData({
                                    ...formData,
                                    public_profile: !formData.public_profile,
                                })
                            }
                            className={`px-4 py-2 font-bold border-2 border-black transition-colors ${
                                formData.public_profile
                                    ? "cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white border-b-2 border-yellow-700 hover:border-yellow-800"
                                    : "cursor-pointer bg-green-500 hover:bg-green-600 text-white border-b-2 border-green-700 hover:border-green-800"
                            }`}
                        >
                            {formData.public_profile ? "Private" : "Public"}
                        </button>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => onClose("cancel", "")}
                            className="px-4 py-2 bg-gray-500 text-white font-bold border-2 border-black hover:bg-gray-600 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white font-bold border-2 border-black hover:bg-green-600 transition-colors cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
