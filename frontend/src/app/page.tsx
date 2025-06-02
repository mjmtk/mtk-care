"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to MTK Care
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Healthcare Management System
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            {!session ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Sign in to your account
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Please sign in with your organization account to continue.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => signIn("azure-ad")}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Sign in with Microsoft
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt="User profile"
                      className="h-12 w-12 rounded-full"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Welcome, {session.user?.name || "User"}!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {session.user?.email}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Information
                  </h3>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => signOut()}
                    variant="outline"
                    className="w-full"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
