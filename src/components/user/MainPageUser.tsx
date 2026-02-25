"use client";

import { Input } from "@heroui/react";
import { Users, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import EmployeeTable from "./EmployeeTable";
import CustomerTable from "./CustomerTable";
import CreateEmployee from "./forms/createEmployee";
import CreateCustomer from "./forms/createCustomer";
import type { MainPageUserProps } from "@/lib/type";

export default function MainPageUser({
    users,
    positions,
}: MainPageUserProps) {

    const [q, setQ] = useState("");

    const [employeeOpen, setEmployeeOpen] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);

    // 🔥 filter จาก localUsers เท่านั้น
    const filtered = useMemo(() => {

        if (!q) return users;

        return users.filter(u =>
            (u.displayName ?? "")
                .toLowerCase()
                .includes(q.toLowerCase())
        );

    }, [users, q]);

    const employees = useMemo(() => {
        return filtered.filter(u =>
            (u.position?.positionName ?? "").toLowerCase() !== "ลูกค้า"
        );
    }, [filtered]);

    const customers = useMemo(() => {
        return filtered.filter(u =>
            (u.position?.positionName ?? "").toLowerCase() === "ลูกค้า"
        );
    }, [filtered]);

    return (

        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

            {/* HEADER */}
            <div className="flex items-center gap-4">

                <div className="p-3 rounded-2xl bg-orange-500/10">
                    <Users className="text-orange-500" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-default-400 text-sm">
                        จัดการพนักงานและลูกค้า
                    </p>
                </div>

            </div>

            {/* SEARCH */}
            <Input
                startContent={<Search size={16} />}
                placeholder="ค้นหา..."
                value={q}
                onValueChange={setQ}
                classNames={{
                    inputWrapper: "rounded-full shadow-lg backdrop-blur"
                }}
            />

            {/* TABLE GRID */}
            <div className="grid xl:grid-cols-2 gap-8">

                <EmployeeTable
                    users={employees}
                    onAdd={() => setEmployeeOpen(true)}
                />

                <CustomerTable
                    users={customers}
                    onAdd={() => setCustomerOpen(true)}
                />

            </div>

            {/* MODALS */}
            <CreateEmployee
                isOpen={employeeOpen}
                onOpenChange={setEmployeeOpen}
                positions={positions}
            />

            <CreateCustomer
                isOpen={customerOpen}
                onOpenChange={setCustomerOpen}
            />

        </div>
    );
}
