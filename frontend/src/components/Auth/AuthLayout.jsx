function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full overflow-hidden relative bg-white flex items-center justify-center px-4 sm:px-6 py-8">

      {/* Background Blur */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-blue-600 rounded-full blur-[120px] sm:blur-[180px] opacity-20 top-0 left-0"></div>

      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500 rounded-full blur-[120px] sm:blur-[180px] opacity-20 bottom-0 right-0"></div>

      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700 shadow-2xl p-6 sm:p-8">

        {children}

      </div>

    </div>
  );
}

export default AuthLayout;