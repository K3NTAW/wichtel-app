"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Copy, Users, Gift, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Group = {
  id: string;
  name: string;
  share_code: string;
  is_assigned: boolean;
};

type Participant = {
  id: string;
  name: string;
  created_at: string;
};

export default function GroupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.id as string;
  const shareCode = searchParams.get("code") || "";

  const [group, setGroup] = useState<Group | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [foundParticipant, setFoundParticipant] = useState<Participant | null>(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("id, name, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);
    } catch (err: any) {
      setError(err.message || "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const checkUserParticipant = useCallback(async () => {
    if (!group) return;
    
    const user = await getCurrentUser();
    if (user) {
      // Check if user has a participant entry for this group
      const { data, error: participantError } = await supabase
        .from("participants")
        .select("id, name, created_at")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data && !participantError) {
        setFoundParticipant(data);
      }
    } else {
      // Fallback to localStorage for non-logged-in users
      if (typeof window !== "undefined" && group?.is_assigned) {
        const storedParticipantId = localStorage.getItem(`wichtel_participant_${groupId}`);
        if (storedParticipantId) {
          // Verify the participant exists and is in this group
            supabase
              .from("participants")
              .select("id, name, created_at")
              .eq("id", storedParticipantId)
              .eq("group_id", groupId)
              .maybeSingle()
              .then(({ data, error }) => {
                if (data && !error) {
                  setFoundParticipant(data);
                }
              });
        }
      }
    }
  }, [groupId, group]);

  useEffect(() => {
    loadGroup();
    const interval = setInterval(loadGroup, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadGroup]);

  useEffect(() => {
    checkUserParticipant();
  }, [checkUserParticipant]);

  const copyShareLink = () => {
    const link = `${window.location.origin}/group/${groupId}?code=${shareCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchParticipant = async () => {
    if (!searchName.trim()) return;
    
    setSearching(true);
    try {
      const { data, error: searchError } = await supabase
        .from("participants")
        .select("id, name, created_at")
        .eq("group_id", groupId)
        .ilike("name", `%${searchName.trim()}%`)
        .limit(1)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        throw searchError;
      }

      if (!data) {
        setFoundParticipant(null);
        setError("Participant not found. Make sure you've joined the group first.");
      } else {
        setFoundParticipant(data);
        setError(null);
      }
    } catch (err: any) {
      setFoundParticipant(null);
      setError(err.message || "Failed to search participant");
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async () => {
    if (participants.length < 2) {
      setError("You need at least 2 participants to assign Wichtels");
      return;
    }

    if (group?.is_assigned) {
      setError("Wichtels have already been assigned for this group!");
      return;
    }

    if (assigning) {
      return; // Prevent double-clicks
    }

    setAssigning(true);
    setError(null);

    try {
      // Check if assignments already exist
      const { data: existingAssignments, error: checkError } = await supabase
        .from("assignments")
        .select("id")
        .eq("group_id", groupId)
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAssignments && existingAssignments.length > 0) {
        // Assignments already exist, just mark the group as assigned
        const { error: updateError } = await supabase
          .from("groups")
          .update({ is_assigned: true })
          .eq("id", groupId);

        if (updateError) throw updateError;
        loadGroup();
        return;
      }

      // Get all participants
      const { data: allParticipants, error: fetchError } = await supabase
        .from("participants")
        .select("id")
        .eq("group_id", groupId);

      if (fetchError) throw fetchError;
      if (!allParticipants || allParticipants.length < 2) {
        throw new Error("Need at least 2 participants");
      }

      // Shuffle participants
      const shuffled = [...allParticipants].sort(() => Math.random() - 0.5);
      
      // Create assignments (each person gets the next person in the shuffled array)
      const assignments = shuffled.map((participant, index) => ({
        group_id: groupId,
        giver_id: participant.id,
        receiver_id: shuffled[(index + 1) % shuffled.length].id,
      }));

      // Insert assignments
      const { error: assignError } = await supabase
        .from("assignments")
        .insert(assignments);

      if (assignError) {
        // Handle duplicate key error specifically
        if (assignError.code === '23505') {
          // Assignments were created between our check and insert
          // Just mark the group as assigned
          const { error: updateError } = await supabase
            .from("groups")
            .update({ is_assigned: true })
            .eq("id", groupId);

          if (updateError) throw updateError;
          loadGroup();
          return;
        }
        throw assignError;
      }

      // Mark group as assigned
      const { error: updateError } = await supabase
        .from("groups")
        .update({ is_assigned: true })
        .eq("id", groupId);

      if (updateError) throw updateError;

      // Reload to show updated state
      loadGroup();
    } catch (err: any) {
      if (err.code === '23505') {
        setError("Wichtels have already been assigned. Refreshing...");
        // Reload to get the updated state
        setTimeout(() => loadGroup(), 1000);
      } else {
        setError(err.message || "Failed to assign Wichtels");
      }
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Link href="/" className="block mt-4">
              <Button variant="outline" className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{group?.name}</CardTitle>
            <CardDescription>Share this code with your friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Share Code</p>
                <p className="text-3xl font-mono font-bold tracking-widest">{shareCode}</p>
              </div>
              <Button
                onClick={copyShareLink}
                variant="outline"
                size="icon"
                className="h-14 w-14"
              >
                {copied ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Participants ({participants.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No participants yet. Share the code above!
              </p>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-3 bg-muted rounded-lg flex items-center justify-between"
                  >
                    <span className="font-medium">{participant.name}</span>
                    {group?.is_assigned && foundParticipant && foundParticipant.id === participant.id ? (
                      <Link href={`/group/${groupId}/wichtel/${participant.id}?code=${shareCode}`}>
                        <Button variant="outline" size="sm">
                          View My Wichtel
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {group?.is_assigned ? "Assigned" : "Joined"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!group?.is_assigned && participants.length >= 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                <CardTitle>Assign Wichtels</CardTitle>
              </div>
              <CardDescription>
                Once everyone has joined, click to randomly assign Wichtels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAssign} 
                className="w-full" 
                size="lg"
                disabled={assigning || group?.is_assigned}
              >
                {assigning ? "Assigning..." : "Assign Wichtels"}
              </Button>
            </CardContent>
          </Card>
        )}

        {group?.is_assigned && (
          <>
            {/* Info banner */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Wichtels have been assigned!</strong> Find your name below (or search for it) to see who you&apos;re buying a gift for.
              </AlertDescription>
            </Alert>

            {/* Most prominent: Quick access if we know who they are */}
            {foundParticipant && (
              <Card className="border-primary border-2 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Gift className="h-6 w-6 text-primary" />
                    View Your Wichtel
                  </CardTitle>
                  <CardDescription className="text-base">
                    You&apos;re registered as <strong>{foundParticipant.name}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/group/${groupId}/wichtel/${foundParticipant.id}?code=${shareCode}`}>
                    <Button className="w-full" size="lg" variant="default">
                      <Gift className="h-5 w-5 mr-2" />
                      See Who I&apos;m Buying For
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Search option */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Wichtels Assigned!
                </CardTitle>
                <CardDescription>
                  {foundParticipant 
                    ? "Not you? Search for a different name below" 
                    : "Enter your name to see who you&apos;re buying a gift for"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchParticipant()}
                    className="text-lg"
                  />
                  <Button
                    onClick={handleSearchParticipant}
                    disabled={searching || !searchName.trim()}
                    size="lg"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {foundParticipant && searchName && (
                  <Alert>
                    <AlertDescription className="flex items-center justify-between">
                      <span className="font-medium">Found: {foundParticipant.name}</span>
                      <Link href={`/group/${groupId}/wichtel/${foundParticipant.id}?code=${shareCode}`}>
                        <Button size="sm">View My Wichtel</Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* List of all participants - only show your own if found */}
            {foundParticipant && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Participant Entry</CardTitle>
                  <CardDescription>
                    You&apos;re registered as {foundParticipant.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                    <span className="font-medium text-lg">{foundParticipant.name}</span>
                    <Link href={`/group/${groupId}/wichtel/${foundParticipant.id}?code=${shareCode}`}>
                      <Button variant="outline" size="sm">
                        <Gift className="h-4 w-4 mr-2" />
                        View My Wichtel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List of all participants (names only, no access to their Wichtels) */}
            <Card>
              <CardHeader>
                <CardTitle>All Participants ({participants.length})</CardTitle>
                <CardDescription>
                  Everyone who has joined this group
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="p-3 bg-muted rounded-lg flex items-center justify-between"
                      >
                        <span className="font-medium">{participant.name}</span>
                        {foundParticipant && foundParticipant.id === participant.id ? (
                          <span className="text-sm text-primary font-medium">(You)</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Joined</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No participants found
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!group?.is_assigned && (
          <div className="text-center">
            <Link href={`/group/${groupId}/join?code=${shareCode}`}>
              <Button variant="outline">Join as Participant</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

