import type { Types } from 'mongoose';
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

export async function releaseRooms(roomTypeId: Types.ObjectId, nights: string[], quantity: number) {
  if (!nights.length) return;
  await RoomNightModel.updateMany({ roomTypeId, date: { $in: nights } }, { $inc: { booked: -quantity } });
}

const isDuplicateKey = (error: unknown) => (error as { code?: number })?.code === 11000;

/**
 * Atomically takes `quantity` rooms for every night, or none at all.
 * Each night is a conditional increment; the unique (roomTypeId, date) index turns a lost race
 * on a full night into a duplicate-key error instead of an overbooking.
 * ponytail: compensating release instead of a transaction; a crash mid-loop can strand counters. Move to a Mongo transaction if that shows up.
 */
export async function reserveRooms(room: RoomRef, nights: string[], quantity: number) {
  const unavailable = () => new AppError(409, 'ROOM_UNAVAILABLE', 'Not enough rooms are available for the selected dates.');
  if (quantity > room.totalRooms) throw unavailable();

  const taken: string[] = [];
  try {
    for (const date of nights) {
      await RoomNightModel.findOneAndUpdate(
        { roomTypeId: room._id, date, booked: { $lte: room.totalRooms - quantity } },
        { $inc: { booked: quantity } },
        { upsert: true },
      );
      taken.push(date);
    }
  } catch (error) {
    await releaseRooms(room._id, taken, quantity);
    throw isDuplicateKey(error) ? unavailable() : error;
  }
}
