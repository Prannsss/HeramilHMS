
"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserStore } from "@/hooks/use-user-store"

export function UserNav() {
  const pathname = usePathname();
  const isDoctor = pathname.startsWith('/doctor');
  const isAdmin = pathname.startsWith('/admin');
  const { avatar, user } = useUserStore();
  
  const profileLink = "/doctor/profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full mt-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar || "https://placehold.co/100x100.png"} alt="@user" data-ai-hint="user avatar" />
            <AvatarFallback></AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || (user?.role === 'Admin' ? 'Administrator' : 'User')}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isDoctor && (
            <>
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href={profileLink}>Profile</Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
            </>
        )}
        <DropdownMenuItem asChild>
            <Link href="/">Logout</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
