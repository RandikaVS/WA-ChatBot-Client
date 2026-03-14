import {
  IconRobot,
  IconMessage2,
  IconShoppingCart,
  IconPackage,
  IconLayoutDashboard,
  IconChartBar,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "OVERVIEW",         // better than "HOME" — tells you it's a summary view
  },
  {
    id: uniqueId(),
    title: "Dashboard",            // universally understood, keep it
    icon: IconLayoutDashboard,
    href: "/",
  },

  {
    navlabel: true,
    subheader: "AI ASSISTANT",     // clear — this section is about the bot's brain
  },
  {
    id: uniqueId(),
    title: "My Agent",             // good as-is — feels personal and modern
    icon: IconRobot,               // robot icon fits better than typography
    href: "/manage-bot/agent",
  },
  {
    id: uniqueId(),
    title: "Conversations",        // better than "Messages" — implies full chat threads
    icon: IconMessage2,
    href: "/manage-bot/messages",
  },

  {
    navlabel: true,
    subheader: "STORE",            // clean, simple — groups commerce-related items
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,        // shopping cart is more intuitive than aperture
    href: "/store/orders",
  },
  {
    id: uniqueId(),
    title: "Products",             // fixed the typo from "Prodcuts"
    icon: IconPackage,             // package fits products better than a smiley face
    href: "/store/products",
  },
  {
    id: uniqueId(),
    title: "Analytics",          // bot performance, message volume, escalation rate
    icon: IconChartBar,
    href: "/store/analytics",
  },
];

export default Menuitems;