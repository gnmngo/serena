'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({ fallbackUrl = '/' }) {
  const router = useRouter();

  const handleBack = () => {
    // If there is history, go back; otherwise, go to fallback URL
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      <span className="text-sm">Back</span>
    </button>
  );
}