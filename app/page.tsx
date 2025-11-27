"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/error-handler";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
          {!isSupabaseConfigured() && (
            <Alert variant="destructive">
              <AlertDescription>
                Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.
              </AlertDescription>
            </Alert>
          )}
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
              <CardDescription className="text-center text-sm text-muted-foreground mt-4">
                You need to sign in to create or join groups
              </CardDescription>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
