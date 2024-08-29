"use client"
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { SignInButton, SignOutButton, SignedIn, SignedOut, useOrganization, useSession, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";

export default function Home() {
  const organization = useOrganization();
  const user = useUser();
  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }
  const files = useQuery(api.file.getFiles, orgId ? { orgId } : "skip")
  const createFile = useMutation(api.file.createFile)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Button onClick={() => {
        if (!orgId) {
          return
        }
        createFile({
          name: "hello world",
          orgId: orgId
        })
      }
      }>Upload</Button>

      {
        files?.map((file) => (
          <span>{file.name}</span>
        ))
      }
    </main >
  );
}
