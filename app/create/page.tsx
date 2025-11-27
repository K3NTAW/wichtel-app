"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { generateShareCode } from "@/lib/group-utils";
import { getCurrentUser } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const shareCode = generateShareCode();
      const user = await getCurrentUser();
      
      const { data, error: supabaseError } = await supabase
        .from("groups")
        .insert({
          name: groupName,
          share_code: shareCode,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (supabaseError) {
        // If code already exists, try again
        if (supabaseError.code === "23505") {
          const newCode = generateShareCode();
          const { data: retryData, error: retryError } = await supabase
            .from("groups")
            .insert({
              name: groupName,
              share_code: newCode,
            })
            .select()
            .single();

          if (retryError) throw retryError;
          router.push(`/group/${retryData.id}?code=${newCode}`);
        } else {
          throw supabaseError;
        }
      } else if (data) {
        router.push(`/group/${data.id}?code=${shareCode}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl">Create New Group</CardTitle>
          </div>
          <CardDescription>
            Create a group and share the code with your friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="e.g., Christmas 2024"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

