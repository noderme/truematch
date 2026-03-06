"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [story, setStory] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("/api/cities");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCities(data);
      } catch (err) {
        console.error(err);
        setCities([]);
      }
    };
    fetchCities();
  }, []);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoginRedirect = () => router.push("/login");
  const handleSignup = async () => {
    /* your signup logic */

    if (files.length === 0) return alert("Please upload at least one photo");
    if (!username.trim() || !story.trim() || !cityId) {
      return alert("Please fill in all fields");
    }

    setLoading(true);

    try {
      // 1️⃣ Convert uploaded files to base64
      const photosBase64 = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                // Remove the data:image/...;base64, prefix
                resolve((reader.result as string).split(",")[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );

      // 2️⃣ Detect gender
      const genderRes = await fetch("/api/detect-gender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: photosBase64 }),
      });

      const genderData = await genderRes.json();
      if (!genderRes.ok)
        throw new Error(genderData.error || "Gender detection failed");
      setGender(genderData.gender);

      // 3️⃣ Signup
      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          story,
          cityId,
          password,
          gender: genderData.gender,
        }),
      });

      const signupData = await signupRes.json();

      // 4️⃣ Upload photos to R2
      const formData = new FormData();
      formData.append("userId", signupData.id.toString());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const uploadRes = await fetch("/api/upload-photos", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Photo upload failed");
      }

      // 5️⃣ Save photo URLs in DB
      await fetch("/api/save-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: signupData.id,
          photos: uploadData.urls,
        }),
      });
      if (!signupRes.ok) throw new Error(signupData.error || "Signup failed");

      // ✅ Wrap userId as id for traits queue
      const traitsJobData = {
        ...signupData,
        id: signupData.id,
      };

      // Add job to traits queue
      await fetch("/api/addToQueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupData: traitsJobData }),
      });

      console.log("Signup + traits job added:", traitsJobData);

      // 5️⃣ Redirect to user match page
      router.push(`/match/${signupData.id}`);
      console.log("Signup flow completed successfully", { signupData });
    } catch (err: any) {
      console.error("Error during signup flow:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      name: "Endless swiping",
      other: false,
      ours: true,
      description: "Only show people interested in the same things",
    },
    {
      name: "Subscription just to swipe",
      other: false,
      ours: true,
      description: "No paywall to use core features",
    },
    {
      name: "End-to-end encryption",
      other: false,
      ours: true,
      description: "Your messages stay private",
    },
    {
      name: "We read your messages",
      other: true,
      ours: false,
      description: "Complete privacy",
    },
    {
      name: "True compatibility focus",
      other: false,
      ours: true,
      description: "Matches based on vibe & interests",
    },
    {
      name: "Complex algorithms",
      other: true,
      ours: false,
      description: "Simple & transparent matching",
    },
    {
      name: "Feeding personal data to algorithms",
      other: true,
      ours: false,
      description: "No data exploitation",
    },
    {
      name: "Profile visibility control",
      other: false,
      ours: true,
      description: "Only compatible users see you",
    },
    {
      name: "Designed to truly meet people",
      other: false,
      ours: true,
      description: "Encourages meaningful connections",
    },
    {
      name: "Designed for revenue",
      other: true,
      ours: false,
      description: "Focused on user freedom",
    },
  ];

  const renderBadge = (value: boolean) => (
    <span
      className={`inline-block px-3 py-1 rounded-full text-white font-semibold text-sm ${value ? "bg-green-500" : "bg-red-500"}`}
    >
      {value ? "✓" : "✕"}
    </span>
  );

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Container */}
      <div className="flex flex-1 h-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Table */}
        <div className="flex-1 flex flex-col bg-gray-50 p-6 md:p-10">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Why Choose Us?
          </h2>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-200 z-10">
                <tr>
                  <th className="py-3 px-2 text-left text-gray-600">Feature</th>
                  <th className="py-3 px-2 text-center text-gray-600">
                    Other Apps
                  </th>
                  <th className="py-3 px-2 text-center text-gray-600">
                    Our App
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {features.map((f, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className={
                        idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-100 hover:bg-gray-200 transition"
                      }
                    >
                      <td className="py-3 px-2">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-gray-500 text-sm">
                          {f.description}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {renderBadge(f.other)}
                      </td>
                      <td className="py-3 px-2 text-center bg-indigo-100 rounded">
                        {renderBadge(f.ours)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Join Us
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Create your profile and find your match
          </p>

          <div className="flex flex-col gap-4">
            <input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-400 shadow-md placeholder-gray-400 text-base transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-400 shadow-md placeholder-gray-400 text-base transition"
            />
            <textarea
              placeholder="Tell us about yourself..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-400 shadow-md min-h-[140px] resize-none placeholder-gray-400 text-base transition"
            />
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-400 shadow-md text-base transition"
            >
              <option value="">Select your city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="inline-block bg-indigo-100 text-indigo-800 px-5 py-2 rounded-lg cursor-pointer hover:bg-indigo-200 shadow-md font-medium transition">
              Upload Photos
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative w-24 h-24 border rounded-xl overflow-hidden shadow-sm"
                >
                  <img
                    src={src}
                    alt={`preview ${i}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-800 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg font-semibold transition"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
              <button
                type="button"
                onClick={handleLoginRedirect}
                disabled={loginLoading}
                className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-xl hover:bg-gray-300 shadow-lg font-semibold transition"
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
