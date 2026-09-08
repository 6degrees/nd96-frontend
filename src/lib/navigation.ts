import {
    LayoutDashboard,
    Building2,
    UsersRound,
    Landmark,
    MessagesSquare,
    MonitorCog,
    type LucideIcon,
} from 'lucide-react'

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type NavigationItem = {
    key: string
    label: {
        en: string
        ar: string
    }
    href: string
    icon: LucideIcon
    badge?: string
}

export type NavigationGroup = {
    key: string
    title: {
        en: string
        ar: string
    }
    items: NavigationItem[]
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

export const navigation: NavigationGroup[] = [
    /*
    |--------------------------------------------------------------------------
    | Main
    |--------------------------------------------------------------------------
    */

    {
        key: 'main',
        title: {
            en: 'Main',
            ar: 'الرئيسية',
        },
        items: [
            {
                key: 'overview',
                label: {
                    en: 'Overview',
                    ar: 'نظرة عامة',
                },
                href: '/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Users
    |--------------------------------------------------------------------------
    */

    {
        key: 'users',
        title: {
            en: 'Users',
            ar: 'المستخدمون',
        },
        items: [
            {
                key: 'users',
                label: {
                    en: 'Users',
                    ar: 'المستخدمون',
                },
                href: '/dashboard/users',
                icon: UsersRound,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Departments
    |--------------------------------------------------------------------------
    */

    {
        key: 'departments',
        title: {
            en: 'Departments',
            ar: 'الإدارات',
        },
        items: [
            {
                key: 'departments',
                label: {
                    en: 'Departments',
                    ar: 'الإدارات',
                },
                href: '/dashboard/departments',
                icon: Building2,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Screens
    |--------------------------------------------------------------------------
    */

    {
        key: 'screens',
        title: {
            en: 'Screens',
            ar: 'الشاشات',
        },
        items: [
            {
                key: 'screens',
                label: {
                    en: 'Screen Management',
                    ar: 'إدارة الشاشات',
                },
                href: '/dashboard/screens',
                icon: MonitorCog,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Timeline
    |--------------------------------------------------------------------------
    */

    {
        key: 'timeline',
        title: {
            en: 'Timeline',
            ar: 'الخط الزمني',
        },
        items: [
            {
                key: 'timeline',
                label: {
                    en: 'National Timeline',
                    ar: 'الخط الزمني الوطني',
                },
                href: '/dashboard/timelines',
                icon: Landmark,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    */

    {
        key: 'messages',
        title: {
            en: 'Messages',
            ar: 'الرسائل',
        },
        items: [
            {
                key: 'messages',
                label: {
                    en: 'Messages',
                    ar: 'الرسائل',
                },
                href: '/dashboard/messages',
                icon: MessagesSquare,
            },
        ],
    },
]

