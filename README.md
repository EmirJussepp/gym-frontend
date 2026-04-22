# GymApp — Frontend

Stack: **Vite + React 18 + TypeScript + Tailwind CSS + Zustand + React Hook Form + Zod**

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El frontend corre en `http://localhost:5173` y hace proxy al backend en `http://localhost:8080`.

## Build producción

```bash
npm run build
```

## Estructura

```
src/
├── components/
│   ├── ui/          # Button, Input, Select, Badge, Card, Modal, Table, Toast, Pagination...
│   └── layout/      # Sidebar, MainLayout, PageHeader, ProtectedRoute
├── pages/
│   ├── auth/        # LoginPage
│   ├── dashboard/   # DashboardPage
│   ├── socios/      # SociosPage + SocioForm
│   ├── planes/      # PlanesPage + PlanForm
│   ├── rutinas/     # RutinasPage + RutinaForm
│   ├── ejercicios/  # EjerciciosPage + EjercicioForm
│   ├── cuotas/      # CuotasPage
│   └── asistencias/ # AsistenciasPage
├── services/        # Llamadas a la API (axios)
├── store/           # Zustand (auth)
├── hooks/           # useToast, usePagination
├── lib/             # axios config, utils (cn, formatDate, formatCurrency)
└── types/           # TypeScript types de toda la app
```

## Variables de entorno

Crear `.env.local` basado en `.env.example`.
