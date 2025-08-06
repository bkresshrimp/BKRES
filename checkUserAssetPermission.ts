// Define the AssetPermissionPaths type (adjust according to your actual permission structure)
type AssetPermissionPaths = string; // or whatever your actual type is

// Define the options interface for the function parameters
interface CheckUserAssetPermissionOptions {
  permissions: AssetPermissionPaths[];
  matchPermissions?: 'OR' | 'AND';
  bonus?: boolean;
}

// Updated function signature to accept an options object
export function checkUserAssetPermission(
  options: CheckUserAssetPermissionOptions
): boolean {
  const { 
    permissions, 
    matchPermissions = 'AND', 
    bonus = true 
  } = options;

  const userDetail = useGetUserDetail()

  if (!userDetail.data) return false

  const userPermissions = userDetail.data.permission['itasset']

  if (matchPermissions === 'OR') {
    return (
      permissions.some((permission) =>
        getAssetPermissionAtPath(userPermissions, permission)
      ) && bonus
    )
  }
  return (
    permissions.every((permission) =>
      getAssetPermissionAtPath(userPermissions, permission)
    ) && bonus
  )
}

// Usage example (this is how you would call it):
const isEdit = checkUserAssetPermission({
  permissions: ['edit_asset'],
  matchPermissions: 'OR',
})