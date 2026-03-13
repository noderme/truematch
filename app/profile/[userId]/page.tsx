import UpdateProfileCityStory from "@/components/UpdateProfile";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-100">Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Update your city and story. Your AI trait analysis will re-run automatically.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur p-6">
          <UpdateProfileCityStory userId={userId} />
        </div>
      </div>
    </div>
  );
}
