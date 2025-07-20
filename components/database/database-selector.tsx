"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Database, Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface DatabaseSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (databaseId: Id<"documents">) => void;
    onCreateNew?: () => void;
}

export const DatabaseSelector = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    onCreateNew 
}: DatabaseSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    
    const databases = useQuery(api.databases.getUserDatabases);

    const filteredDatabases = databases?.filter(db => 
        db.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleSelect = (databaseId: Id<"documents">) => {
        onSelect(databaseId);
        onClose();
        setSearchQuery("");
    };

    const handleClose = () => {
        onClose();
        setSearchQuery("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Select Database
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Command className="border border-border rounded-lg">
                        <CommandInput 
                            placeholder="Search databases..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList className="max-h-64">
                            <CommandEmpty>
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        No databases found
                                    </p>
                                    {onCreateNew && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                onCreateNew();
                                                handleClose();
                                            }}
                                            className="gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create New Database
                                        </Button>
                                    )}
                                </div>
                            </CommandEmpty>
                            
                            {filteredDatabases.length > 0 && (
                                <CommandGroup>
                                    {filteredDatabases.map((database) => (
                                        <CommandItem
                                            key={database._id}
                                            onSelect={() => handleSelect(database._id)}
                                            className="flex items-center gap-3 p-3 cursor-pointer"
                                        >
                                            <Database className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {database.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Database
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>

                    {onCreateNew && (
                        <div className="pt-2 border-t border-border">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onCreateNew();
                                    handleClose();
                                }}
                                className="w-full gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create New Database
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};