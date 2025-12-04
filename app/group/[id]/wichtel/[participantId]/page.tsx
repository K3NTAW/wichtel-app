"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gift, ArrowLeft } from "lucide-react";

type Participant = {
  id: string;
  name: string;
  hobbies: string | null;
  favorite_colors: string | null;
  interests: string | null;
  gift_preferences: string | null;
  other_info: string | null;
};

export default function ViewWichtelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.id as string;
  const participantId = params.participantId as string;
  const shareCode = searchParams.get("code") || "";

  const [wichtel, setWichtel] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const checkAccess = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      
      // Check if this participant belongs to the current user
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select("user_id")
        .eq("id", participantId)
        .eq("group_id", groupId)
        .maybeSingle();

      if (participantError && participantError.code !== 'PGRST116') {
        throw participantError;
      }

      if (!participant) {
        setError("Participant not found.");
        setCheckingAccess(false);
        setLoading(false);
        return false;
      }

      // If user is logged in, verify they own this participant entry
      if (user) {
        if (participant.user_id !== user.id) {
          setError("You can only view your own Wichtel. Access denied.");
          setCheckingAccess(false);
          setLoading(false);
          return false;
        }
      } else {
        // For non-logged-in users, check localStorage
        if (typeof window !== "undefined") {
          const storedParticipantId = localStorage.getItem(`wichtel_participant_${groupId}`);
          if (storedParticipantId !== participantId) {
            setError("You can only view your own Wichtel. Access denied.");
            setCheckingAccess(false);
            setLoading(false);
            return false;
          }
        } else {
          setError("Please sign in to view your Wichtel.");
          setCheckingAccess(false);
          setLoading(false);
          return false;
        }
      }

      setCheckingAccess(false);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to verify access");
      setCheckingAccess(false);
      setLoading(false);
      return false;
    }
  }, [groupId, participantId]);

  const loadWichtel = useCallback(async () => {
    try {
      // First, get the assignment to find who this participant should gift
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .select("receiver_id")
        .eq("group_id", groupId)
        .eq("giver_id", participantId)
        .maybeSingle();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw assignmentError;
      }

      if (!assignment) {
        // Check if group is assigned
        const { data: group, error: groupError } = await supabase
          .from("groups")
          .select("is_assigned")
          .eq("id", groupId)
          .maybeSingle();

        if (groupError && groupError.code !== 'PGRST116') {
          throw groupError;
        }

        if (!group || !group.is_assigned) {
          setError("Wichtels haven&apos;t been assigned yet. Please wait for the group organizer to assign them.");
          setLoading(false);
          return;
        } else {
          setError("No assignment found for this participant.");
          setLoading(false);
          return;
        }
      }

      // Get the receiver's information
      const { data: receiver, error: receiverError } = await supabase
        .from("participants")
        .select("*")
        .eq("id", assignment.receiver_id)
        .single();

      if (receiverError) throw receiverError;
      setWichtel(receiver);
    } catch (err: any) {
      setError(err.message || "Failed to load Wichtel");
    } finally {
      setLoading(false);
    }
  }, [groupId, participantId]);

  useEffect(() => {
    const verifyAndLoad = async () => {
      const hasAccess = await checkAccess();
      if (hasAccess) {
        loadWichtel();
      }
    };
    verifyAndLoad();
  }, [checkAccess, loadWichtel]);

  if (checkingAccess || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {checkingAccess ? "Verifying access..." : "Loading your Wichtel..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
            <Link href={`/group/${groupId}?code=${shareCode}`} className="block mt-4">
              <Button variant="outline" className="w-full">Back to Group</Button>
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
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/group/${groupId}?code=${shareCode}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  <CardTitle className="text-3xl">Your Wichtel</CardTitle>
                </div>
                <CardDescription className="mt-2 text-base">
                  🎁 This is the person you&apos;re buying a gift for! Use their answers below to choose the perfect present.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-8 bg-primary/10 rounded-lg border-2 border-primary text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h2 className="text-3xl font-bold mb-2">{wichtel?.name}</h2>
              <p className="text-lg text-muted-foreground">You&apos;re buying a gift for {wichtel?.name}!</p>
            </div>

            {wichtel && (
              <div className="space-y-4">
                {wichtel.hobbies && (
                  <div>
                    <h3 className="font-semibold mb-2">Hobbies</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {wichtel.hobbies}
                    </p>
                  </div>
                )}

                {wichtel.favorite_colors && (
                  <div>
                    <h3 className="font-semibold mb-2">Favorite Colors</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {wichtel.favorite_colors}
                    </p>
                  </div>
                )}

                {wichtel.interests && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {wichtel.interests}
                    </p>
                  </div>
                )}

                {wichtel.gift_preferences && (
                  <div>
                    <h3 className="font-semibold mb-2">Gift Preferences</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {wichtel.gift_preferences}
                    </p>
                  </div>
                )}

                {wichtel.other_info && (
                  <div>
                    <h3 className="font-semibold mb-2">Additional Information</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {wichtel.other_info}
                    </p>
                  </div>
                )}

                {!wichtel.hobbies && !wichtel.favorite_colors && !wichtel.interests && 
                 !wichtel.gift_preferences && !wichtel.other_info && (
                  <Alert>
                    <AlertDescription>
                      No additional information provided. You&apos;ll have to be creative! 🎨
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <Link href={`/group/${groupId}?code=${shareCode}`}>
                <Button variant="outline" className="w-full">
                  Back to Group
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

