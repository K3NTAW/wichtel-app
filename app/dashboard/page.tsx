"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, signOut } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Gift, Users, LogOut, Plus, ArrowRight } from "lucide-react";

type Group = {
  id: string;
  name: string;
  share_code: string;
  is_assigned: boolean;
  created_at: string;
};

type Participant = {
  id: string;
  name: string;
  group_id: string;
  group: Group;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // Load groups where user is creator
      const { data: createdGroups, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .eq("created_by", currentUser.id)
        .order("created_at", { ascending: false });

      if (groupsError) throw groupsError;
      setGroups(createdGroups || []);

      // Load groups where user is a participant
      const { data: participantData, error: participantsError } = await supabase
        .from("participants")
        .select(`
          id,
          name,
          group_id,
          group:groups(*)
        `)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (participantsError) throw participantsError;
      setParticipants((participantData || []) as Participant[]);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get unique groups from participants (groups user joined but didn't create)
  const joinedGroups = participants
    .map((p) => p.group as Group)
    .filter((g) => !groups.some((cg) => cg.id === g.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.user_metadata?.name || user.email}!
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Groups I Created */}
        {groups.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Groups I Created</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      {group.name}
                    </CardTitle>
                    <CardDescription>Code: {group.share_code}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {group.is_assigned ? (
                        <span className="text-green-600 font-medium">✓ Assigned</span>
                      ) : (
                        <span className="text-muted-foreground">Pending assignment</span>
                      )}
                    </div>
                    <Link href={`/group/${group.id}?code=${group.share_code}`}>
                      <Button variant="outline" className="w-full">
                        View Group
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Groups I Joined */}
        {joinedGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Groups I Joined</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {joinedGroups.map((group) => {
                const participant = participants.find((p) => p.group_id === group.id);
                return (
                  <Card key={group.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {group.name}
                      </CardTitle>
                      <CardDescription>
                        You're registered as: {participant?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        {group.is_assigned ? (
                          <span className="text-green-600 font-medium">✓ Assigned</span>
                        ) : (
                          <span className="text-muted-foreground">Waiting for assignment</span>
                        )}
                      </div>
                      {group.is_assigned && participant ? (
                        <Link
                          href={`/group/${group.id}/wichtel/${participant.id}?code=${group.share_code}`}
                        >
                          <Button className="w-full">
                            <Gift className="h-4 w-4 mr-2" />
                            View My Wichtel
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/group/${group.id}?code=${group.share_code}`}>
                          <Button variant="outline" className="w-full">
                            View Group
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {groups.length === 0 && joinedGroups.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Groups Yet</CardTitle>
              <CardDescription>
                Create a new group or join an existing one to get started!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/create">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </Link>
              <Link href="/join">
                <Button variant="outline" className="w-full">
                  Join Existing Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

