"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const participantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  hobbies: z.string().optional(),
  favorite_colors: z.string().optional(),
  interests: z.string().optional(),
  gift_preferences: z.string().optional(),
  other_info: z.string().optional(),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

export default function JoinAsParticipantPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.id as string;
  const shareCode = searchParams.get("code") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [isAssigned, setIsAssigned] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
  });

  const loadGroup = useCallback(async () => {
    try {
      const { data, error: groupError } = await supabase
        .from("groups")
        .select("name, is_assigned")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroupName(data.name);
      setIsAssigned(data.is_assigned);
    } catch (err: any) {
      setError(err.message || "Failed to load group");
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const onSubmit = async (data: ParticipantFormData) => {
    setError(null);
    setLoading(true);

    try {
      const user = await getCurrentUser();
      
      const { data: participant, error: insertError } = await supabase
        .from("participants")
        .insert({
          group_id: groupId,
          user_id: user?.id || null,
          name: data.name,
          hobbies: data.hobbies || null,
          favorite_colors: data.favorite_colors || null,
          interests: data.interests || null,
          gift_preferences: data.gift_preferences || null,
          other_info: data.other_info || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store participant ID in localStorage for easy access
      if (typeof window !== "undefined") {
        localStorage.setItem(`wichtel_participant_${groupId}`, participant.id);
      }

      // Redirect to view their Wichtel if already assigned, otherwise back to group page
      if (isAssigned) {
        router.push(`/group/${groupId}/wichtel/${participant.id}?code=${shareCode}`);
      } else {
        router.push(`/group/${groupId}?code=${shareCode}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/group/${groupId}?code=${shareCode}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <CardTitle className="text-2xl">Join {groupName}</CardTitle>
            </div>
            <CardDescription>
              Tell us about yourself to help your Wichtel choose the perfect gift
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name")}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobbies">Hobbies</Label>
                <Textarea
                  id="hobbies"
                  placeholder="e.g., Reading, hiking, photography..."
                  {...register("hobbies")}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favorite_colors">Favorite Colors</Label>
                <Input
                  id="favorite_colors"
                  placeholder="e.g., Blue, green, purple..."
                  {...register("favorite_colors")}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <Textarea
                  id="interests"
                  placeholder="e.g., Technology, cooking, travel..."
                  {...register("interests")}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gift_preferences">Gift Preferences</Label>
                <Textarea
                  id="gift_preferences"
                  placeholder="e.g., I love books, prefer experiences over things..."
                  {...register("gift_preferences")}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="other_info">Anything else?</Label>
                <Textarea
                  id="other_info"
                  placeholder="Any other information that might help..."
                  {...register("other_info")}
                  disabled={loading}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Joining..." : "Join Group"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

