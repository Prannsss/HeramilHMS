
'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BedDouble } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

type RoomStatus = 'Vacant' | 'Occupied';

interface Room {
  id: number;
  status: RoomStatus;
}

interface Floor {
  floor: number;
  rooms: Room[];
}

const generateInitialState = (): Floor[] => {
  const floors = [];
  for (let i = 1; i <= 3; i++) {
    const rooms = [];
    for (let j = 1; j <= 20; j++) {
      rooms.push({
        id: (i - 1) * 20 + j,
        status: Math.random() > 0.6 ? 'Occupied' : 'Vacant',
      });
    }
    floors.push({ floor: i, rooms });
  }
  return floors;
};

export default function RoomsPage() {
  const [floors, setFloors] = useState<Floor[]>(generateInitialState);

  const handleRoomClick = (floorIndex: number, roomIndex: number) => {
    const newFloors = [...floors];
    const room = newFloors[floorIndex].rooms[roomIndex];
    room.status = room.status === 'Vacant' ? 'Occupied' : 'Vacant';
    setFloors(newFloors);
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

      <div className="space-y-8">
        {floors.map((floor, floorIndex) => (
          <Card key={floor.floor}>
            <CardHeader>
              <CardTitle>Floor {floor.floor}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                {floor.rooms.map((room, roomIndex) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(floorIndex, roomIndex)}
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
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
