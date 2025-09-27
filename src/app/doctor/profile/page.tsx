
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pen, Eye, EyeOff } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';

import DashboardLayout from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { getCroppedImg } from '@/lib/cropImage';
import { useUserStore } from '@/hooks/use-user-store';
import { Label } from '@/components/ui/label';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  specialization: z.string().min(2, 'Specialization is required.'),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

function ChangePasswordModal() {
    const { toast } = useToast();
    const { user } = useUserStore();
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        if (!user?.doctor_id) {
            toast({
                title: 'Error',
                description: 'Doctor ID not found. Please log in again.',
                variant: 'destructive',
                duration: 3000,
            });
            return;
        }

        setIsPasswordLoading(true);
        
        try {
            const response = await fetch('http://localhost/HeramilHMS/public/backend/api/change-password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doctor_id: user.doctor_id,
                    current_password: values.currentPassword,
                    new_password: values.newPassword,
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast({
                    title: 'Password Changed',
                    description: 'Your password has been successfully changed.',
                    duration: 3000,
                });
                passwordForm.reset();
                setIsOpen(false);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to change password.',
                    variant: 'destructive',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast({
                title: 'Error',
                description: 'Failed to change password. Please try again.',
                variant: 'destructive',
                duration: 3000,
            });
        } finally {
            setIsPasswordLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Change Password</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Choose a new password for your account.
                    </DialogDescription>
                </DialogHeader>
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showCurrentPassword ? "text" : "password"} 
                                            {...field} 
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 hover:text-black"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showNewPassword ? "text" : "password"} 
                                            {...field} 
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 hover:text-black"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            {...field} 
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 hover:text-black"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPasswordLoading}>
                                {isPasswordLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Change Password
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function ImageCropper({ image, onCropComplete, onCancel }: { image: string, onCropComplete: (croppedImage: string) => void, onCancel: () => void }) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(image, croppedAreaPixels);
                onCropComplete(croppedImage);
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop your new profile picture</DialogTitle>
                    <DialogDescription>
                        Adjust the image below to get the perfect crop.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative h-64 w-full bg-secondary">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={setZoom}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Zoom</Label>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => setZoom(value[0])}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function DoctorProfilePage() {
    const { toast } = useToast();
    const { avatar, setAvatar, user } = useUserStore();
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: '',
            email: '',
            specialization: '',
        },
    });

    // Fetch profile data directly from database
    const fetchProfileData = useCallback(async () => {
        const doctorId = user?.doctor_id || user?.id;
        if (!doctorId) {
            console.log('No doctor_id found in user:', user);
            return;
        }

        try {
            setIsLoading(true);
            const url = `http://localhost/HeramilHMS/public/backend/api/doctors.php?doctor_id=${doctorId}`;
            console.log('Fetching profile data from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const responseText = await response.text();
            console.log('Raw response:', responseText.substring(0, 200) + '...');
            
            const data = JSON.parse(responseText);
            
            if (data.success && data.data) {
                console.log('Profile data received:', data.data);
                setProfileData(data.data);
            } else {
                console.error('Failed to fetch profile data:', data.error || data);
                toast({
                    title: 'Error',
                    description: 'Failed to load profile data.',
                    variant: 'destructive',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load profile data. Please try again.',
                variant: 'destructive',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    // Fetch data when component mounts or user changes
    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input to allow re-uploading the same file
        if(event.target) {
            event.target.value = "";
        }
    };
    
    const handleCropComplete = (croppedImage: string) => {
        setAvatar(croppedImage);
        setImageToCrop(null);
        toast({
            title: "Profile Picture Updated",
            description: "Your new profile picture has been saved.",
            duration: 3000,
        });
    };

    return (
        <DashboardLayout role="doctor">
            <PageHeader
                title="Your Profile"
                description="Manage your account details and settings."
            />
             {imageToCrop && (
                <ImageCropper
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToCrop(null)}
                />
            )}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card className="h-full overflow-hidden">
                        <CardContent className="p-0 h-full">
                            <div className="relative h-full w-full">
                                <Avatar className="h-full w-full rounded-none">
                                    <AvatarImage
                                        src={avatar || "https://placehold.co/400x400.png"}
                                        data-ai-hint="doctor avatar"
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-none">DR</AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    className="absolute bottom-2 right-2 rounded-full h-10 w-10"
                                    onClick={handleAvatarClick}
                                >
                                    <Pen className="h-5 w-5" />
                                    <span className="sr-only">Edit Profile Picture</span>
                                </Button>
                                <Input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Your profile information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Specialization</Label>
                                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                                        <p className="text-sm">{profileData?.name || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                                        <p className="text-sm">{profileData?.email || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Specialization</Label>
                                        <p className="text-sm">{profileData?.specialization || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                                        <p className="text-sm">{profileData?.department || 'Not provided'}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <ChangePasswordModal />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
