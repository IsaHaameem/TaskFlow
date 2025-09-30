import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center shadow-sm bg-white">
        <Link href="/" className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-indigo-600"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="ml-2 font-semibold text-lg">TaskFlow</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4 text-gray-600"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              Streamline Your Workflow with TaskFlow
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              The AI-powered project management platform designed to help your team achieve more, faster.
            </p>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </main>

       {/* Footer */}
       <footer className="flex items-center justify-center py-4 border-t bg-white">
         <p className="text-sm text-gray-500">© 2025 TaskFlow. All rights reserved.</p>
       </footer>
    </div>
  );
}