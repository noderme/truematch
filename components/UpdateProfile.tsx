"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UpdateProfileProps {
  userId: string;
}

// A photo is either an existing URL (saved) or a new pending file+preview
type ExistingPhoto = { kind: "existing"; url: string };
type NewPhoto = { kind: "new"; file: File; preview: string };
type Photo = ExistingPhoto | NewPhoto;

export default function UpdateProfileCityStory({ userId }: UpdateProfileProps) {
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [story, setStory] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPhotos, setFetchingPhotos] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const router = useRouter();

  // Load cities + current profile + photos in parallel
  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, photosRes, citiesRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/users/${userId}/photos`),
          fetch("/api/cities"),
        ]);

        if (citiesRes.ok) {
          const data = await citiesRes.json();
          setCities(data);
        }

        if (profileRes.ok) {
          const { user } = await profileRes.json();
          if (user) {
            setCityId(user.city_id ? String(user.city_id) : "");
            setStory(user.story || "");
          }
        }

        if (photosRes.ok) {
          const { photos: urls } = await photosRes.json();
          setPhotos((urls as string[]).map((url) => ({ kind: "existing", url })));
        }
      } catch {
        // silently ignore — form still usable
      } finally {
        setFetchingPhotos(false);
      }
    };
    load();
  }, [userId]);

  // Add new photos from file input
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newPhotos: NewPhoto[] = Array.from(e.target.files).map((file) => ({
      kind: "new",
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    setPhotoError("");
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  // Remove a photo (existing or new)
  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setPhotoError("At least one photo is required.");
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPhotoError("");

    if (photos.length === 0) {
      setPhotoError("At least one photo is required to save your profile.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload any new files
      const newPhotos = photos.filter((p): p is NewPhoto => p.kind === "new");
      let newUrls: string[] = [];

      if (newPhotos.length > 0) {
        const formData = new FormData();
        formData.append("userId", userId);
        newPhotos.forEach((p) => formData.append("files", p.file));

        const uploadRes = await fetch("/api/upload-photos", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Photo upload failed");
        newUrls = uploadData.urls;
      }

      // 2. Build the final ordered URL list (existing kept + new uploaded)
      const finalUrls = photos.map((p, i) => {
        if (p.kind === "existing") return p.url;
        // map new photos to their uploaded URLs in order
        const newIndex = photos
          .slice(0, i)
          .filter((x) => x.kind === "new").length;
        return newUrls[newIndex];
      });

      // 3. Save photo URLs to DB (replaces all)
      const saveRes = await fetch("/api/save-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), photos: finalUrls }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json();
        throw new Error(d.error || "Failed to save photos");
      }

      // 4. Update city + story (also re-queues traits)
      const profileRes = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId, story }),
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || "Failed to update profile");

      // Replace any new previews with the real uploaded URLs
      setPhotos(finalUrls.map((url) => ({ kind: "existing", url })));
      setSuccess("Profile updated! Your traits are being re-analysed.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  };

  const inputCls =
    "w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Status messages */}
      {error && (
        <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-xl px-4 py-2.5">
          {success}
        </div>
      )}

      {/* ── Photos Section ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Photos
          </label>
          <span className="text-xs text-slate-600">{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Photo grid */}
        {fetchingPhotos ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden border border-slate-700/60 group"
              >
                <img
                  src={photo.kind === "existing" ? photo.url : photo.preview}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Position badge */}
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white font-medium">
                    Main
                  </div>
                )}
                {/* New badge */}
                {photo.kind === "new" && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-fuchsia-500/80 text-[10px] text-white font-medium">
                    New
                  </div>
                )}
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 text-slate-300 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all duration-150"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add photo tile */}
            <label className="aspect-square rounded-xl border border-dashed border-slate-700/60 bg-slate-800/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all duration-200 text-slate-600 hover:text-fuchsia-400">
              <span className="text-xl leading-none">＋</span>
              <span className="text-[10px]">Add photo</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>
          </div>
        )}

        {/* Photo error */}
        {photoError && (
          <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-2.5">
            <span>⚠</span>
            {photoError}
          </div>
        )}
      </div>

      {/* ── City ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          City
        </label>
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className={`${inputCls} bg-slate-800/60`}
          required
        >
          <option value="" className="bg-slate-900">Select your city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id} className="bg-slate-900">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Story ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Your Story
        </label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className={`${inputCls} min-h-[160px] resize-none`}
          placeholder="Tell us about yourself — your interests, personality, what you're looking for…"
          required
        />
        <p className="text-xs text-slate-600">
          Updating your story will re-run the AI trait analysis automatically.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          disabled={loading || photos.length === 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white text-sm font-semibold shadow-lg shadow-fuchsia-900/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border border-slate-700/80 text-sm font-medium text-slate-400 hover:text-rose-400 hover:border-rose-800/60 transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </form>
  );
}
