export interface NavigationTab {
	id: string;
	name: string;
	url: string;
	icon?: any;
}

export const useNavigationItems = (): NavigationTab[] => {
	const navigationItems: NavigationTab[] = [];

	return navigationItems;
};
