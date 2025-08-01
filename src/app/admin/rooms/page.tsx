
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BedDouble, LogOut, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type RoomStatus = 'Vacant' | 'Occupied';

interface Patient {
  id: string;
  name: string;
  dateOfAdmission: string;
  reasonForAdmission: string;
}

interface Room {
  id: number;
  room_number: string;
  floor: number;
  status: RoomStatus;
  occupant?: Patient;
}

interface Floor {
  floor: number;
  rooms: Room[];
}

interface RoomsData {
  floors: Floor[];
  statistics: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
  };
}

function OccupantDetailsModal({
  room,
  isOpen,
  onOpenChange,
  onVacate,
  isVacating,
}: {
  room: Room | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVacate: (roomId: number) => void;
  isVacating: boolean;
}) {
  if (!isOpen || !room || !room.occupant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Occupant Details - Room {room.room_number}</DialogTitle>
          <DialogDescription>
            Information for the patient occupying this room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <p className="font-medium text-muted-foreground">Patient Name</p>
                    <p>{room.occupant.name}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Patient ID</p>
                    <p>{room.occupant.id}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Date of Admission</p>
                    <p>{room.occupant.dateOfAdmission}</p>
                </div>
                <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Reason for Admission</p>
                    <p>{room.occupant.reasonForAdmission}</p>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onVacate(room.id);
              onOpenChange(false);
            }}
            disabled={isVacating}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isVacating ? 'Vacating...' : 'Vacate Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomsPage() {
  const [roomsData, setRoomsData] = useState<RoomsData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVacating, setIsVacating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchRoomsData = async () => {
    try {
      setIsLoading(true);
      
      // First, sync the rooms data with patient data to ensure consistency
      try {
        await fetch('http://localhost/HeramilHMS/public/backend/api/patients.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_id: 0, // Not used for sync action
            action: 'sync_rooms'
          }),
        });
      } catch (syncError) {
        console.warn('Room sync failed, continuing with room data fetch:', syncError);
      }
      
      // Then fetch the updated room data
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/rooms.php');
      if (!response.ok) {
        throw new Error('Failed to fetch rooms data');
      }
      const data = await response.json();
      setRoomsData(data);
    } catch (error) {
      console.error('Error fetching rooms data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rooms data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsData();
  }, []);

  const handleRoomClick = (room: Room) => {
    if (room.status === 'Occupied') {
      setSelectedRoom(room);
      setIsModalOpen(true);
    } else {
      // Logic to make a vacant room occupied could be added here
      // For now, we'll just log it.
      console.log(`Room ${room.room_number} is vacant. An occupied room must be selected to see details.`);
    }
  };

  const handleVacateRoom = async (roomId: number) => {
    try {
      setIsVacating(true);
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/rooms.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          action: 'vacate'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message || "Room vacated successfully",
        });
        // Refresh the rooms data
        await fetchRoomsData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to vacate room",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error vacating room:', error);
      toast({
        title: "Error",
        description: "Failed to vacate room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVacating(false);
    }
  };

  const handleRefreshRooms = async () => {
    try {
      setIsRefreshing(true);
      await fetchRoomsData();
      toast({
        title: "Success",
        description: "Room data refreshed and synchronized successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh room data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <PageHeader title="Room Occupancy" description="View and manage the status of all hospital rooms." />
        <div className="flex items-center justify-center h-64">
          <p>Loading rooms data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!roomsData) {
    return (
      <DashboardLayout role="admin">
        <PageHeader title="Room Occupancy" description="View and manage the status of all hospital rooms." />
        <div className="flex items-center justify-center h-64">
          <p>Failed to load rooms data. Please refresh the page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { totalRooms, occupiedRooms, vacantRooms } = roomsData.statistics;

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Room Occupancy" description="View and manage the status of all hospital rooms." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <BedDouble className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalRooms}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
                 <BedDouble className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{occupiedRooms}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vacant Rooms</CardTitle>
                <BedDouble className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{vacantRooms}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="floor-1">
                <TabsList>
                    {roomsData.floors.map((floor) => (
                        <TabsTrigger key={floor.floor} value={`floor-${floor.floor}`}>
                            Floor {floor.floor}
                        </TabsTrigger>
                    ))}
                </TabsList>
                 {roomsData.floors.map((floor, floorIndex) => (
                    <TabsContent key={floor.floor} value={`floor-${floor.floor}`}>
                        <div className="grid grid-cols-5 gap-4 pt-4">
                            {floor.rooms.map((room, roomIndex) => (
                            <div
                                key={room.id}
                                onClick={() => handleRoomClick(room)}
                                className={cn(
                                'p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
                                room.status === 'Vacant'
                                    ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200'
                                    : 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200'
                                )}
                            >
                                <div className="text-lg font-bold text-center">
                                {room.room_number}
                                </div>
                                <Badge
                                className={cn(
                                    'mt-2',
                                    room.status === 'Vacant'
                                    ? 'bg-green-600'
                                    : 'bg-red-600'
                                )}
                                >
                                {room.status}
                                </Badge>
                            </div>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </CardContent>
      </Card>
      <OccupantDetailsModal 
        room={selectedRoom}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onVacate={handleVacateRoom}
        isVacating={isVacating}
      />
    </DashboardLayout>
  );
}
