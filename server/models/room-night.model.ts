import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

// One counter per room type per night. The unique index makes concurrent reservations race-safe.
const roomNightSchema = new Schema({
  roomTypeId: { type: Schema.Types.ObjectId, ref: 'HotelRoomType', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  booked: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

roomNightSchema.index({ roomTypeId: 1, date: 1 }, { unique: true });

export const RoomNightModel: Model<any> = (mongoose.models.RoomNight as Model<any> | undefined)
  ?? mongoose.model<any>('RoomNight', roomNightSchema);
