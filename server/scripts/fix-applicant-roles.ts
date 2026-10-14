// One-time fix: users who applied before "role on approval" still carry vendor_owner without an approved business.
// Dry run by default (lists who would change). Writes only with --apply:  npx tsx server/scripts/fix-applicant-roles.ts --apply
import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { UserModel } from '../models/user.model.js';
import { VendorModel } from '../models/vendor.model.js';

const apply = process.argv.includes('--apply');
if (!await connectDatabase()) process.exit(1);

const approvedOwners = await VendorModel.distinct('ownerId', { status: 'approved', deletedAt: null });
const filter = { roles: 'vendor_owner', _id: { $nin: approvedOwners } };
const users = await UserModel.find(filter).select('email roles').lean();
for (const user of users as any[]) {
  const vendor = await VendorModel.findOne({ ownerId: user._id }).select('name status').lean() as any;
  console.log(`${user.email}  roles=${user.roles.join(',')}  business=${vendor ? `${vendor.name} (${vendor.status})` : 'none'}`);
}
console.log(`${users.length} user(s) hold vendor_owner without an approved business.`);

if (apply && users.length) {
  const ids = users.map((user: any) => user._id);
  const pulled = await UserModel.updateMany({ ...filter, _id: { $in: ids } }, { $pull: { roles: 'vendor_owner' } });
  // Anyone left with no roles goes back to being a plain customer.
  await UserModel.updateMany({ _id: { $in: ids }, roles: { $size: 0 } }, { $set: { roles: ['customer'] } });
  console.log(`Removed vendor_owner from ${pulled.modifiedCount} user(s).`);
} else if (users.length) {
  console.log('Dry run — nothing changed. Re-run with --apply to remove the role.');
}
await disconnectDatabase();
