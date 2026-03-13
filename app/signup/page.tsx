"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/** Resize a File to max 800px on the longest side and return raw base64 (JPEG). */
function resizeToBase64(file: File, maxPx = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

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

  const handleSignup = async () => {
    if (files.length === 0) return alert("Please upload at least one photo");
    if (!username.trim() || !story.trim() || !cityId) {
      return alert("Please fill in all fields");
    }

    setLoading(true);

    try {
      // 1️⃣ Resize + convert to base64 (keeps each image well under Claude's 5 MB limit)
      const photosBase64 = await Promise.all(files.map((f) => resizeToBase64(f)));

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

      // 4️⃣ Upload photos to R2
      const formData = new FormData();
      formData.append("userId", signupData.id.toString());
      files.forEach((file) => formData.append("files", file));

      const uploadRes = await fetch("/api/upload-photos", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Photo upload failed");

      // 5️⃣ Save photo URLs in DB
      await fetch("/api/save-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: signupData.id, photos: uploadData.urls }),
      });

      // Add job to traits queue
      const traitsJobData = { ...signupData, id: signupData.id };
      await fetch("/api/addToQueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupData: traitsJobData }),
      });

      // Store token in localStorage (cookie is set server-side automatically)
      if (signupData.token) {
        localStorage.setItem("token", signupData.token);
      }

      console.log("Signup + traits job added:", traitsJobData);
      router.push(`/match/${signupData.id}`);
    } catch (err: any) {
      console.error("Error during signup flow:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { name: "Endless swiping", other: false, ours: true, description: "Only show people interested in the same things" },
    { name: "Subscription just to swipe", other: false, ours: true, description: "No paywall to use core features" },
    { name: "End-to-end encryption", other: false, ours: true, description: "Your messages stay private" },
    { name: "We read your messages", other: true, ours: false, description: "Complete privacy" },
    { name: "True compatibility focus", other: false, ours: true, description: "Matches based on vibe & interests" },
    { name: "Complex algorithms", other: true, ours: false, description: "Simple & transparent matching" },
    { name: "Feeding personal data to algorithms", other: true, ours: false, description: "No data exploitation" },
    { name: "Profile visibility control", other: false, ours: true, description: "Only compatible users see you" },
    { name: "Designed to truly meet people", other: false, ours: true, description: "Encourages meaningful connections" },
    { name: "Designed for revenue", other: true, ours: false, description: "Focused on user freedom" },
  ];

  const renderBadge = (value: boolean) => (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
        value
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
      }`}
    >
      {value ? "✓" : "✕"}
    </span>
  );

  const inputCls = "w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition";

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-stretch py-4 px-2 sm:px-0">
      <div className="flex flex-col lg:flex-row flex-1 max-w-6xl mx-auto w-full gap-4">

        {/* ── Left: Comparison Table ── */}
        <div className="flex-1 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-slate-100">Why Kindred?</h2>
            <p className="text-sm text-slate-500 mt-1">See how we compare to the rest</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                  <th className="py-3 px-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Feature</th>
                  <th className="py-3 px-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Others</th>
                  <th className="py-3 px-3 text-center text-xs font-medium text-fuchsia-400 uppercase tracking-wider">Us</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {features.map((f, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">{f.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{f.description}</div>
                      </td>
                      <td className="py-3 px-3 text-center">{renderBadge(f.other)}</td>
                      <td className="py-3 px-3 text-center bg-fuchsia-500/5 rounded">{renderBadge(f.ours)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Signup Form ── */}
        <div className="flex-1 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur overflow-y-auto">
          <div className="px-6 pt-6 pb-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-fuchsia-500/30 mx-auto mb-4">
              AI
            </div>
            <h1 className="text-2xl font-semibold text-slate-50">Create your profile</h1>
            <p className="text-sm text-slate-500 mt-1">Find people who actually match your vibe</p>
          </div>

          <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            <textarea
              placeholder="Tell us about yourself — your interests, personality, what you're looking for…"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className={`${inputCls} min-h-[120px] resize-none`}
            />
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className={`${inputCls} bg-slate-800/60`}
            >
              <option value="" className="bg-slate-900">Select your city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>

            {/* Photo upload */}
            <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-slate-600 bg-slate-800/30 px-4 py-3 text-sm text-slate-400 cursor-pointer hover:border-fuchsia-500/50 hover:text-fuchsia-300 hover:bg-fuchsia-500/5 transition-all duration-200">
              <span>＋</span>
              <span>Upload Photos</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFilesChange} />
            </label>

            {/* Photo previews */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700/60">
                    <img src={src} alt={`preview ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-rose-400 text-xs flex items-center justify-center hover:bg-rose-500 hover:text-white transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white text-sm font-semibold shadow-lg shadow-fuchsia-900/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Creating profile…" : "Create Profile"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full py-3 rounded-xl border border-slate-700/80 text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
