"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMatchQueue } from "@/lib/queues";

export default function Signup() {
  const [files, setFiles] = useState<File[]>([]);
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [story, setStory] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("/api/cities");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        // data is already an array, not { cities: [...] }
        setCities(data);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
        setCities([]);
      }
    };

    fetchCities();
  }, []);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);

    // Append new files to existing state
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);

    // Append previews
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  const handleSignup = async () => {
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

  const handleLoginRedirect = () => {
    router.push("/login"); // navigate to login page
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 text-center">
          Join Us
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
          Create your profile and find your match
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <textarea
              placeholder="Tell us about yourself..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] text-base resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="">Select your city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Upload Button */}
          <div className="mb-4">
            <label className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-300">
              Upload Photos
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>
          </div>

          {/* Image Previews */}
          <div className="flex flex-wrap gap-2 mb-4">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative w-20 h-20 border rounded overflow-hidden"
              >
                <img
                  src={src}
                  alt={`preview ${i}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex w-full gap-2">
            <button
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 w-1/2 bg-green-600 text-white p-2 rounded text-center"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={handleLoginRedirect}
              disabled={loading}
              className="flex-1 w-1/2 bg-green-600 text-white p-2 rounded text-center"
            >
              {loading ? "Signing up..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
