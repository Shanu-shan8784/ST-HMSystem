import React, { useState, useEffect } from 'react';
import { hostelService } from '../../services/hostelService';
import Modal from '../../components/Modal';
import EnrollStudentModal from '../../components/EnrollStudentModal';
import { toast } from 'react-toastify';
import {
  BedDouble,
  UserPlus,
  ArrowLeftRight,
  Wrench,
  CheckCircle2,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { getRoomStatusStyle } from '../../utils/validators';

const RoomAllocation = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Allocation Modal State
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocateRoomTarget, setAllocateRoomTarget] = useState(null);
  const [allocateForm, setAllocateForm] = useState({
    studentName: '',
    rollNumber: '',
    bedNumber: 1,
  });

  // Swap Modal State
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [swapForm, setSwapForm] = useState({
    roomAId: '',
    studentAId: '',
    roomBId: '',
    studentBId: '',
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await hostelService.getRooms();
      if (res.success) {
        setRooms(res.rooms);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateRoomTarget) return;

    try {
      const res = await hostelService.allocateRoom({
        roomId: allocateRoomTarget._id,
        studentName: allocateForm.studentName,
        rollNumber: allocateForm.rollNumber,
        bedNumber: Number(allocateForm.bedNumber),
      });

      if (res.success) {
        setIsAllocateOpen(false);
        setAllocateForm({ studentName: '', rollNumber: '', bedNumber: 1 });
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await hostelService.swapStudents(swapForm);
      if (res.success) {
        setIsSwapOpen(false);
        setSwapForm({ roomAId: '', studentAId: '', roomBId: '', studentBId: '' });
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleToggleMaintenance = async (room) => {
    const newStatus = room.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await hostelService.updateRoomStatus(room._id, newStatus);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchBlock = selectedBlock === 'All' || r.block === selectedBlock;
    const matchFloor = selectedFloor === 'All' || String(r.floor) === String(selectedFloor);
    const matchSearch =
      !searchQuery ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.occupants?.some((o) => o.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchBlock && matchFloor && matchSearch;
  });

  // Students available for swapping
  const allOccupantsList = rooms.flatMap((r) =>
    (r.occupants || []).map((o) => ({
      ...o,
      roomId: r._id,
      roomNumber: r.roomNumber,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Top Title & Swap Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Room Matrix & Allocation Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visual dormitory grid with bed capacities, room swap controls, and real-time occupancy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEnrollOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
          <button
            onClick={() => setIsSwapOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Swap Student Rooms</span>
          </button>
        </div>
      </div>

      {/* Legend & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        {/* Status Color Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Room Status Color Coding:
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Available (Green)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              Occupied (Red)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Maintenance (Yellow)
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search room (e.g. A-101) or student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Block:</span>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="All">All Blocks</option>
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Block C">Block C</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Floor:</span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="All">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Matrix Grid View */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading room matrix...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const style = getRoomStatusStyle(room.status);
            const isFull = room.occupiedBeds >= room.capacity;

            return (
              <div
                key={room._id}
                className={`rounded-2xl border-2 ${style.cardBorder} bg-white dark:bg-slate-900 p-5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Top header */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {room.roomNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {room.block} &bull; Floor {room.floor}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleMaintenance(room)}
                      title={room.status === 'maintenance' ? 'Restore from maintenance' : 'Mark as under maintenance'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bed Capacity Progress */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-blue-500" />
                        Bed Capacity
                      </span>
                      <span>
                        {room.occupiedBeds} / {room.capacity} occupied
                      </span>
                    </div>

                    {/* Visual Bed Cards */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Array.from({ length: room.capacity }).map((_, idx) => {
                        const occupant = room.occupants?.[idx];
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-xs border ${
                              occupant
                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between text-[11px]">
                              <span>Bed #{idx + 1}</span>
                              <span className="text-[10px] opacity-75 font-normal">
                                {occupant ? 'Filled' : 'Vacant'}
                              </span>
                            </div>
                            <div className="text-[11px] truncate font-medium mt-0.5">
                              {occupant ? occupant.name : '— Available —'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amenities */}
                  {room.amenities?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {room.amenities.map((a, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ₹{room.rentFee?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/sem</span>
                  </span>

                  {!isFull && room.status !== 'maintenance' ? (
                    <button
                      onClick={() => {
                        setAllocateRoomTarget(room);
                        setAllocateForm({ studentName: '', rollNumber: '', bedNumber: room.occupiedBeds + 1 });
                        setIsAllocateOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Student</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 italic">
                      {room.status === 'maintenance' ? 'Under Repair' : 'No vacant beds'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Allocate Room Modal */}
      <Modal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title={`Assign Student to Room ${allocateRoomTarget?.roomNumber}`}
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shan Elegance"
              value={allocateForm.studentName}
              onChange={(e) => setAllocateForm({ ...allocateForm, studentName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                required
                placeholder="2024-uobsac-946"
                value={allocateForm.rollNumber}
                onChange={(e) => setAllocateForm({ ...allocateForm, rollNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bed Number
              </label>
              <select
                value={allocateForm.bedNumber}
                onChange={(e) => setAllocateForm({ ...allocateForm, bedNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {Array.from({ length: allocateRoomTarget?.capacity || 2 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Bed #{i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAllocateOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Confirm Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* Swap Students Modal */}
      <Modal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        title="Swap Students Between Hostel Rooms"
      >
        <form onSubmit={handleSwapSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select two currently housed students to mutually swap their designated rooms and beds.
          </p>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">
              Student A
            </span>
            <select
              required
              value={swapForm.studentAId}
              onChange={(e) => {
                const selected = allOccupantsList.find((o) => o.studentId === e.target.value);
                setSwapForm({
                  ...swapForm,
                  studentAId: e.target.value,
                  roomAId: selected?.roomId || '',
                });
              }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Student A --</option>
              {allOccupantsList.map((occ) => (
                <option key={occ.studentId} value={occ.studentId}>
                  {occ.name} (Room {occ.roomNumber}, Bed #{occ.bedNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-3">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase">
              Student B
            </span>
            <select
              required
              value={swapForm.studentBId}
              onChange={(e) => {
                const selected = allOccupantsList.find((o) => o.studentId === e.target.value);
                setSwapForm({
                  ...swapForm,
                  studentBId: e.target.value,
                  roomBId: selected?.roomId || '',
                });
              }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Student B --</option>
              {allOccupantsList
                .filter((o) => o.studentId !== swapForm.studentAId)
                .map((occ) => (
                  <option key={occ.studentId} value={occ.studentId}>
                    {occ.name} (Room {occ.roomNumber}, Bed #{occ.bedNumber})
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSwapOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!swapForm.studentAId || !swapForm.studentBId}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50"
            >
              Execute Room Swap
            </button>
          </div>
        </form>
      </Modal>

      {/* Warden Enroll Student Modal */}
      <EnrollStudentModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        onSuccess={() => fetchRooms()}
        defaultHostelBlock={selectedBlock !== 'All' ? selectedBlock : 'Block A'}
      />
    </div>
  );
};

export default RoomAllocation;

