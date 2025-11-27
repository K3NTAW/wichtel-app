"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">🎁 Wichteln</CardTitle>
          <CardDescription className="text-lg mt-2">
            Create or join a gift exchange group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <Link href="/dashboard" className="block">
                <Button className="w-full" size="lg">
                  My Groups
                </Button>
              </Link>
              <Link href="/create" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Create New Group
                </Button>
              </Link>
              <Link href="/join" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Join Existing Group
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="block">
                <Button className="w-full" size="lg">
                  Sign In / Sign Up
                </Button>
              </Link>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue without account</span>
                </div>
              </div>
              <Link href="/create" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Create New Group
                </Button>
              </Link>
              <Link href="/join" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Join Existing Group
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
