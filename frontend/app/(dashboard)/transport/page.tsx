"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, GitBranch } from "lucide-react";

export default function TransportPage() {
  const sections = [
    {
      title: "Vehicles",
      description: "Manage school transport vehicles",
      icon: Bus,
      href: "/transport/vehicles",
      color: "bg-blue-500",
    },
    {
      title: "Transport Routes",
      description: "Create and manage transport routes and fares",
      icon: MapPin,
      href: "/transport/routes",
      color: "bg-green-500",
    },
    {
      title: "Assign Vehicles",
      description: "Assign vehicles to routes",
      icon: GitBranch,
      href: "/transport/assign-vehicles",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transport Module</h1>
        <p className="text-gray-600 mt-2">Manage school transport operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`${section.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="text-white" size={24} />
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={section.href}>
                  <Button variant="outline" className="w-full">
                    Manage {section.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
