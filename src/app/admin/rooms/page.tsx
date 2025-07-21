
'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BedDouble, LogOut } from 'lucide-react';
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

type RoomStatus = 'Vacant' | 'Occupied';

interface Patient {
  id: string;
  name: string;
  dateOfAdmission: string;
  reasonForAdmission: string;
}

interface Room {
  id: number;
  status: RoomStatus;
  occupant?: Patient;
}

interface Floor {
  floor: number;
  rooms: Room[];
}

const initialPatients: Patient[] = [
  {
    id: "PAT001",
    name: "Amelia Johnson",
    dateOfAdmission: "2023-06-12",
    reasonForAdmission: "Routine Check-up",
  },
  {
    id: "PAT002",
    name: "Benjamin Carter",
    dateOfAdmission: "2023-06-08",
    reasonForAdmission: "Fractured Arm",
  },
  {
    id: "PAT004",
    name: "Daniel Evans",
    dateOfAdmission: "2023-06-18",
    reasonForAdmission: "Allergic Reaction",
  },
  {
    id: "PAT005",
    name: "Evelyn Foster",
    dateOfAdmission: "2023-05-28",
    reasonForAdmission: "Migraine Treatment",
  },
  {
    id: "PAT006",
    name: "Liam Johnson",
    dateOfAdmission: "2023-07-01",
    reasonForAdmission: "Follow-up",
  },
  {
    id: "PAT007",
    name: "Emma Brown",
    dateOfAdmission: "2023-07-02",
    reasonForAdmission: "Annual Check-up",
  },
  {
    id: "PAT008",
    name: "Noah Williams",
    dateOfAdmission: "2023-07-03",
    reasonForAdmission: "Consultation",
  },
];

const generateInitialState = (): Floor[] => {
  const floors = [];
  let patientIndex = 0;
  for (let i = 1; i <= 3; i++) {
    const rooms: Room[] = [];
    for (let j = 1; j <= 20; j++) {
      const isOccupied = Math.random() > 0.6;
      let occupant: Patient | undefined = undefined;
      if (isOccupied && patientIndex < initialPatients.length) {
        occupant = initialPatients[patientIndex % initialPatients.length];
        patientIndex++;
      }
      rooms.push({
        id: (i - 1) * 20 + j,
        status: isOccupied && occupant ? 'Occupied' : 'Vacant',
        occupant: occupant,
      });
    }
    floors.push({ floor: i, rooms });
  }
  return floors;
};

function OccupantDetailsModal({
  room,
  isOpen,
  onOpenChange,
  onVacate,
}: {
  room: Room | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVacate: (roomId: number) => void;
}) {
  if (!isOpen || !room || !room.occupant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Occupant Details - Room {room.id}</DialogTitle>
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
          <Button variant="destructive" onClick={() => {
            onVacate(room.id);
            onOpenChange(false);
          }}>
            <LogOut className="mr-2 h-4 w-4" />
            Vacate Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function RoomsPage() {
  const [floors, setFloors] = useState<Floor[]>(generateInitialState);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRoomClick = (room: Room) => {
    if (room.status === 'Occupied') {
      setSelectedRoom(room);
      setIsModalOpen(true);
    } else {
      // Logic to make a vacant room occupied could be added here
      // For now, we'll just log it.
      console.log(`Room ${room.id} is vacant. An occupied room must be selected to see details.`);
    }
  };

  const handleVacateRoom = (roomId: number) => {
    setFloors(prevFloors => 
        prevFloors.map(floor => ({
            ...floor,
            rooms: floor.rooms.map(room => 
                room.id === roomId ? { ...room, status: 'Vacant', occupant: undefined } : room
            )
        }))
    );
  };

  const getOccupancyStats = () => {
    let totalRooms = 0;
    let occupiedRooms = 0;
    floors.forEach(floor => {
        totalRooms += floor.rooms.length;
        occupiedRooms += floor.rooms.filter(r => r.status === 'Occupied').length;
    });
    return { totalRooms, occupiedRooms };
  }

  const { totalRooms, occupiedRooms } = getOccupancyStats();
  const vacantRooms = totalRooms - occupiedRooms;

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
                    {floors.map((floor) => (
                        <TabsTrigger key={floor.floor} value={`floor-${floor.floor}`}>
                            Floor {floor.floor}
                        </TabsTrigger>
                    ))}
                </TabsList>
                 {floors.map((floor, floorIndex) => (
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
                                {floor.floor}{String(roomIndex + 1).padStart(2, '0')}
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
      />
    </DashboardLayout>
  );
}
