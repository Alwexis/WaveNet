import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

import Tooltip from "../components/Tooltip";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [formDisabled, setFormDisabled] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateField(e.target, name, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);
        try {
            const _ = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
            const _r = await fetch("https://wavenet.up.railway.app/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                        uid: _.user.uid,
                        username: formData.username,
                        email: formData.email,
                        secret: formData.secret || "",
                }),
            })
            const r = await _r.json();
            if (r.status == "success") {
                navigate("/");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const validateField = (el, name, value) => {
        let error = "";
        if (name === "email" && !/\S+@\S+\.\S+/.test(value)) {
            error = "Use a valid email.";
            el.dataset.invalid = true;
        } else if (name === "password" && value.length < 6) {
            error = "Password must have at least 6 characters.";
            el.dataset.invalid = true;
        } else if (
            name === "username" &&
            (value.length < 3 || value.includes(" "))
        ) {
            error = "Username must have at least 3 characters with no spaces.";
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

    return (
        <main className="flex items-center justify-center h-screen w-full bg-gray-100 py-2 px-6">
            <div className="h-fit max-w-md mx-auto bg-white border-2 border-black p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h1 className="text-4xl font-bold mb-6 text-center">
                    Register
                </h1>
                <form onSubmit={handleSubmit} className="space-y-2">
                    {/* Username */}
                    <div>
                        <label
                            htmlFor="username"
                            className="block font-bold mb-1"
                        >
                            <span className="text-red-600 mr-1">*</span>
                            Username:
                        </label>
                        <input
                            onChange={handleChange}
                            id="username"
                            name="username"
                            className="w-full px-3 py-2 outline-none border-2 data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 border-black transition-all bg-gray-100"
                            required
                            type="text"
                        />
                        {
                            errors.username && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.username}
                                </p>
                            )
                        }
                    </div>
                    <div className="w-full flex items-center justify-between">
                        <div className="w-[45%]">
                            <label
                                htmlFor="email"
                                className="block font-bold mb-1"
                            >
                                <span className="text-red-600 mr-1">*</span>
                                Email:
                            </label>
                            <input
                                onChange={handleChange}
                                id="email"
                                name="email"
                                className="w-full px-3 py-2 outline-none border-2 data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 border-black transition-all bg-gray-100"
                                required
                                type="email"
                            />
                        </div>
                        <div className="w-[45%]">
                            <label
                                htmlFor="password"
                                className="block font-bold mb-1"
                            >
                                <span className="text-red-600 mr-1">*</span>
                                Password:
                            </label>
                            <input
                                onChange={handleChange}
                                id="password"
                                name="password"
                                className="w-full px-3 py-2 outline-none border-2 data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 border-black transition-all bg-gray-100"
                                required=""
                                type="password"
                            />
                        </div>
                    </div>
                    <button
                        disabled={formDisabled}
                        type="submit"
                        className="cursor-pointer disabled:cursor-not-allowed w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 border-b-2 border-green-700 hover:border-green-800 active:border-t-2 active:border-b-0 transition-all duration-100 mt-2"
                    >
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 underline">
                        Login here
                    </a>
                </p>
            </div>
        </main>
    );
}

export default Register;
