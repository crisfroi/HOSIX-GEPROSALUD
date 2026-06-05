import React from 'react';
import { useState } from 'react';
import { Activity } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import DashboardEpidemiologico from '@/components/hosix/epidemiologia/DashboardEpidemiologico';
import { CasosList } from '@/components/hosix/epidemiologia/CasosList';
import { BrotesList } from '@/components/hosix/epidemiologia/BrotesList';
import { NotificarCasoForm } from '@/components/hosix/epidemiologia/NotificarCasoForm';

export default function Epidemiologia() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-8 w-8 text-sky-600" />
            <h1 className="text-3xl font-bold">Epidemiología</h1>
          </div>
          <p className="text-gray-600">
            Centro de control epidemiológico con alertas, brotes y seguimiento de casos.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="dashboard">Resumen</TabsTrigger>
            <TabsTrigger value="casos">Casos</TabsTrigger>
            <TabsTrigger value="brotes">Brotes</TabsTrigger>
            <TabsTrigger value="notificar">Notificar</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardEpidemiologico />
          </TabsContent>

          <TabsContent value="casos">
            <CasosList />
          </TabsContent>

          <TabsContent value="brotes">
            <BrotesList />
          </TabsContent>

          <TabsContent value="notificar">
            <NotificarCasoForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
