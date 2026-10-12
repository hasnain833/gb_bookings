import type { ClientSession, Types } from 'mongoose';
import { RoomNightModel } from '../../models/room-night.model.js';
import { AppError } from '../../shared/app-error.js';

type RoomRef = { _id: Types.ObjectId; totalRooms: number };

/** Rooms still free on every night of the stay, keyed by room type _id. */
export async function availableRoomCounts(roomTypes: RoomRef[], nights: string[]) {
  const counters = await RoomNightModel.find({
    roomTypeId: { $in: roomTypes.map((room) => room._id) },
    date: { $in: nights },
  }).select('roomTypeId booked').lean();

  const peakBooked = new Map<string, number>();
  for (const counter of counters as any[]) {
    const key = String(counter.roomTypeId);
    peakBooked.set(key, Math.max(peakBooked.get(key) ?? 0, counter.booked));
  }
  return new Map(roomTypes.map((room) => [
    String(room._id),
    Math.max(0, room.totalRooms - (peakBooked.get(String(room._id)) ?? 0)),
  ]));
}

export async function releaseRooms(roomTypeId: Types.ObjectId, nights: string[], quantity: number, session: ClientSession) {
  if (!nights.length) return;
  const result = await RoomNightModel.updateMany(
    { roomTypeId, date: { $in: nights }, booked: { $gte: quantity } },
    { $inc: { booked: -quantity } }, { session },
  );
  if (result.modifiedCount !== nights.length) {
    throw new AppError(409, 'INVENTORY_INCONSISTENT', 'Inventory could not be released safely. Please contact support.');
  }
}

const isDuplicateKey = (error: unknown) => (error as { code?: number })?.code === 11000;

/** Initialize empty counters outside the transaction. Concurrent inserts are harmless. */
export async function prepareRoomNights(roomTypeId: Types.ObjectId, nights: string[]) {
  for (const date of nights) {
    try {
      await RoomNightModel.updateOne({ roomTypeId, date }, { $setOnInsert: { booked: 0 } }, { upsert: true });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
}

/** Reserve every night within the same transaction as the booking record. */
export async function reserveRooms(room: RoomRef, nights: string[], quantity: number, session: ClientSession) {
  const unavailable = () => new AppError(409, 'ROOM_UNAVAILABLE', 'Not enough rooms are available for the selected dates.');
  if (quantity > room.totalRooms) throw unavailable();

  for (const date of nights) {
    const result = await RoomNightModel.updateOne(
      { roomTypeId: room._id, date, booked: { $lte: room.totalRooms - quantity } },
      { $inc: { booked: quantity } }, { session },
    );
    if (result.modifiedCount !== 1) throw unavailable();
  }
}
