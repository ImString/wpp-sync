export type Roles = 'OWNER' | 'ADMIN' | 'USER';

export enum PermissionsFlags {
	TRANSFER_OWNERSHIP = 'TRANSFER_OWNERSHIP',
	MEMBER_MANAGE = 'MEMBER_MANAGE',
	MEMBER_KICK = 'MEMBER_KICK',
	INVITE_MANAGE = 'INVITE_MANAGE'
}

export type RolesType = {
	permissions: PermissionsFlags[];
};

const adminPermissions: PermissionsFlags[] = [PermissionsFlags.MEMBER_KICK, PermissionsFlags.INVITE_MANAGE];

export const roles: Record<Roles, RolesType> = {
	OWNER: {
		permissions: [...adminPermissions, PermissionsFlags.MEMBER_MANAGE, PermissionsFlags.TRANSFER_OWNERSHIP]
	},

	ADMIN: {
		permissions: adminPermissions
	},

	USER: {
		permissions: []
	}
};

export const hasPermission = (role: Roles, permission: PermissionsFlags): boolean => {
	return roles[role].permissions.includes(permission);
};
