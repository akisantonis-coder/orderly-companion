# Αποθήκη - Warehouse Order Management

## Overview
A Greek-language warehouse order management application for managing suppliers, products, and orders. Originally built on Lovable/Supabase, migrated to Replit's fullstack JavaScript template with Express backend and PostgreSQL database.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js (v5) with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: react-router-dom v6
- **State Management**: TanStack React Query v5
- **PWA**: vite-plugin-pwa for offline capabilities

## Project Structure
```
├── server/           # Express backend
│   ├── index.ts      # Server entry point (port 5000)
│   ├── vite.ts       # Vite dev server integration
│   ├── db.ts         # Database connection (Drizzle + pg)
│   ├── storage.ts    # Database storage layer (IStorage)
│   └── routes.ts     # API routes
├── shared/
│   └── schema.ts     # Drizzle schema + Zod validation
├── src/              # React frontend
│   ├── App.tsx       # Main app with routes
│   ├── pages/        # Page components
│   ├── components/   # UI components
│   ├── hooks/        # Custom hooks (useSuppliers, useProducts, useOrders)
│   ├── lib/          # Utilities (api.ts, utils.ts)
│   ├── types/        # TypeScript types
│   └── utils/        # Order export (PDF/Excel)
├── drizzle.config.ts # Drizzle Kit config
└── vite.config.ts    # Vite config
```

## Database Tables
- **suppliers**: id, name, email, phone, sort_order
- **products**: id, name, supplier_id, unit, sort_order
- **orders**: id, supplier_id, status (draft/sent), timestamps
- **order_items**: id, order_id, product_id, quantity, unit, sort_order

## Key Features
- Supplier management with drag-and-drop ordering
- Product management per supplier
- Draft order creation and management
- Order item management with quantity editing
- Product search across all suppliers
- PDF and Excel export of orders
- Order sending (marks as sent)
- PWA support for mobile use
- Greek language UI throughout

## API Endpoints
- `GET/POST /api/suppliers` - List/Create suppliers
- `GET/PATCH/DELETE /api/suppliers/:id` - Get/Update/Delete supplier
- `PUT /api/suppliers/order` - Reorder suppliers
- `GET/POST /api/products` - List/Create products
- `GET /api/products/with-suppliers` - Products with supplier data
- `GET /api/products/search?q=` - Search products
- `GET /api/products/duplicates?name=` - Find duplicate products
- `PUT /api/products/order` - Reorder products
- `GET /api/orders/draft` - List draft orders
- `GET /api/orders/:id` - Get order with details
- `GET /api/orders/by-supplier/:supplierId` - Get draft order for supplier
- `POST /api/orders` - Create order
- `POST /api/orders/:id/send` - Mark order as sent
- `POST /api/order-items` - Add item to order
- `PATCH /api/order-items/:id` - Update order item
- `PUT /api/order-items/order` - Reorder items
- `DELETE /api/order-items/:id` - Delete order item

## Recent Changes
- 2026-02-14: Migrated from Lovable/Supabase to Replit fullstack JS template
  - Replaced Supabase client with Express API + Drizzle ORM
  - Removed Supabase authentication (app is now open access)
  - Ported all CRUD operations to server-side API routes
  - Seeded database with sample Greek suppliers and products
  - Email sending simplified to mark orders as "sent"

## Running
- `npm run dev` - Start development server (Express + Vite on port 5000)
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
