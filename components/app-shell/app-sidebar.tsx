"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClinicalDisclaimer } from "./clinical-disclaimer"

const NAV_ITEMS = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/patients/10", label: "Demo Patient #10", icon: FlaskConical },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-4 md:flex"
    >
      <ul className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/patients"
              ? pathname === "/patients"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto space-y-1 border-t border-sidebar-border pt-3">
        <ClinicalDisclaimer variant="compact" />
      </div>
    </nav>
  )
}
