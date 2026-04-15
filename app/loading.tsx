export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#97A97C] mx-auto mb-4"></div>
        <p className="text-[#2C3E2D]">Loading...</p>
      </div>
    </div>
  );
}