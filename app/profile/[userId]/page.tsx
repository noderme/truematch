import UpdateProfileCityStory from "@/components/UpdateProfile";

interface ProfilePageProps {
  params: { userId: string };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = params;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className=" p-6 rounded-lg shadow-md">
          <UpdateProfileCityStory userId={userId} />
        </div>
      </div>
    </div>
  );
}
