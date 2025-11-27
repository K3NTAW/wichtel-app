import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
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
          <Link href="/create" className="block">
            <Button className="w-full" size="lg">
              Create New Group
            </Button>
          </Link>
          <Link href="/join" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Join Existing Group
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

