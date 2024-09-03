"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import z from "zod"
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast'
import { useOrganization, useUser } from '@clerk/nextjs'
import { createFile, generateUploadUrl } from '@/convex/file'
import { api } from "../../../convex/_generated/api";
import { useToast } from '@/components/ui/use-toast';
import { Doc } from "../../../convex/_generated/dataModel";

type Props = {}

const formSchema = z.object({
    title: z.string().min(1).max(200),
    file: z
        .custom<FileList>((val) => val instanceof FileList, "Required")
        .refine((files) => files.length > 0, `Required`),
});

export const UploadButton = (props: Props) => {
    const { toast } = useToast();
    const organization = useOrganization();
    const generateUploadUrl = useMutation(api.file.generateUploadUrl);
    const user = useUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            file: undefined,
        },
    });

    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

    const createFile = useMutation(api.file.createFile);

    const fileRef = form.register("file");

    let orgId: string | undefined = undefined;
    if (organization.isLoaded && user.isLoaded) {
        orgId = organization.organization?.id ?? user.user?.id;
    }


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!orgId) return;

        const postUrl = await generateUploadUrl();

        const fileType = values.file[0].type;

        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": fileType },
            body: values.file[0],
        });
        const { storageId } = await result.json();

        const types = {
            "image/png": "image",
            "application/pdf": "pdf",
            "text/csv": "csv",
        } as Record<string, Doc<"files">["type"]>;

        console.log("==", {
            name: values.title,
            fileId: storageId,
            orgId,
            type: types[fileType],
        })
        try {
            await createFile({
                name: values.title,
                fileId: storageId,
                orgId,
                type: types[fileType],
            });

            form.reset();

            setIsFileDialogOpen(false);

            toast({
                variant: "success",
                title: "File Uploaded",
                description: "Now everyone can view your file",
            });
        } catch (err) {
            console.log("===", err)
            toast({
                variant: "destructive",
                title: "Something went wrong",
                description: "Your file could not be uploaded, try again later",
            });
        }
    }

    return (
        <Dialog
            open={isFileDialogOpen}
            onOpenChange={(isOpen) => {
                setIsFileDialogOpen(isOpen);
                form.reset();
            }}
        >
            <DialogTrigger asChild>
                <Button>Upload File</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="mb-8">Upload your File Here</DialogTitle>
                    <DialogDescription>
                        This file will be accessible by anyone in your organization
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="file"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>File</FormLabel>
                                        <FormControl>
                                            <Input type="file" {...fileRef} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="flex gap-1"
                            >
                                {form.formState.isSubmitting && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Submit
                            </Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}