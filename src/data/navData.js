import { HomeIcon } from '@heroicons/react/24/solid'
import { UserGroupIcon } from '@heroicons/react/24/solid'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'

export const navData = [
    {
        id: 0,
        icon: <HomeIcon />,
        text: "Home",
        link: "/"
    },
    {
        id: 1,
        icon: <UserGroupIcon />,
        text: "Delegates",
        link: "delegates"
    },
    {
        id: 2,
        icon: <ChatBubbleLeftRightIcon />,
        text: "Chatroom",
        link: "chatroom"
    },
    // {
    //     id: 3,
    //     icon: <SettingsIcon />,
    //     text: "Settings",
    //     link: "settings"
    // }
]