import { connectDatabase, disconnectDatabase } from '../src/server/database/connection.js';
import { PermissionModel } from '../src/server/models/permission.model.js';
import { RoleModel } from '../src/server/models/role.model.js';
import { permissionDescriptions, rolePermissions } from '../src/server/modules/auth/rbac.js';

async function main() {
  if (!await connectDatabase()) throw new Error('MongoDB is required to seed roles and permissions.');

  for (const [key, description] of Object.entries(permissionDescriptions)) {
    await PermissionModel.updateOne({ key }, { $set: { description } }, { upsert: true });
  }

  for (const [key, permissions] of Object.entries(rolePermissions)) {
    const name = key.split('_').map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
    await RoleModel.updateOne({ key }, { $set: { name, permissions, system: true } }, { upsert: true });
  }
}

main()
  .then(() => disconnectDatabase())
  .catch(async (error) => {
    console.error(error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
