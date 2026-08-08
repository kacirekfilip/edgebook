"use client";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm">
      <div className="neo-surface my-4 w-full max-w-md rounded-2xl p-5 shadow-2xl sm:p-6">
        {children}
      </div>
    </div>
  );
}
