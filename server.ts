import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  hashPassword,
  optionalAuth,
  requireAdmin,
  requireAuth,
  safeComparePasscode,
  signAuthToken,
  verifyPassword,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import { loadDatabase, saveDatabase, VALID_CATEGORIES } from './server/db.ts';
import type {
  AdminAnalytics,
  MenuCategory,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Reservation,
  ReservationStatus,
} from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Received',
  'Preparing',
  'Out for Delivery',
  'Completed',
  'Cancelled',
];

const VALID_RESERVATION_STATUSES: ReservationStatus[] = [
  'Confirmed',
  'Seated',
  'Completed',
  'Cancelled',
];

const VALID_SEATING_AREAS: Reservation['seatingArea'][] = [
  'Main Roastery Lounge',
  'Golden Courtyard',
  'Espresso Bar Counter',
];

function asTrimmedString(val: unknown, maxLen = 400): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function isValidImageReference(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('/src/assets/')) return true;
  if (/^https:\/\/[^\s]+$/i.test(src)) return true;
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(src) && src.length <= 4_000_000) {
    return true;
  }
  return false;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

async function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));

  // Ensure DB initializes cleanly on boot
  loadDatabase();

  // Public health and runtime configuration
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'cafee-api' });
  });

  app.get('/api/public-config', (_req: Request, res: Response) => {
    const mapsKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      '';
    res.json({ googleMapsApiKey: mapsKey });
  });

  // Menu products
  app.get('/api/products', (req: Request, res: Response) => {
    const db = loadDatabase();
    const category = asTrimmedString(req.query.category, 60);
    const search = asTrimmedString(req.query.search, 100).toLowerCase();
    const featured = req.query.featured === 'true';
    const includeUnavailable = req.query.includeUnavailable === 'true';

    const filtered = db.products.filter((item) => {
      if (!includeUnavailable && !item.available) return false;
      if (category && category !== 'All' && item.category !== category) return false;
      if (featured && !item.featured) return false;
      if (search) {
        const hay = `${item.name} ${item.category} ${item.description} ${item.originNote ?? ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    res.json({ products: filtered });
  });

  // Reviews
  app.get('/api/reviews', (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({ reviews: db.reviews });
  });

  app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const ratingNum = Number(req.body?.rating);
    const comment = asTrimmedString(req.body?.comment, 600);
    const roleOrVisit = asTrimmedString(req.body?.roleOrVisit, 80) || 'Verified Guest';

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }
    if (comment.length < 10) {
      res.status(400).json({ error: 'Please share at least 10 characters in your review.' });
      return;
    }

    const review = {
      id: `rev-${crypto.randomUUID().slice(0, 8)}`,
      authorName: req.user?.name || 'CAFEE Guest',
      roleOrVisit,
      rating: ratingNum,
      comment,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    saveDatabase(db);
    res.status(201).json({ review });
  });

  // Contact form
  app.post('/api/contact', (req: Request, res: Response) => {
    const db = loadDatabase();
    const name = asTrimmedString(req.body?.name, 100);
    const email = asTrimmedString(req.body?.email, 160).toLowerCase();
    const subject = asTrimmedString(req.body?.subject, 140) || 'General Inquiry';
    const message = asTrimmedString(req.body?.message, 1200);

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) {
      res.status(400).json({ error: 'Please provide your name, a valid email, and a message.' });
      return;
    }

    const contact = {
      id: `cnt-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    };
    db.contacts.unshift(contact);
    saveDatabase(db);
    res.status(201).json({ contact, message: 'Thank you for reaching out. Our team will respond shortly.' });
  });

  // Customer Authentication
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const db = loadDatabase();
    const name = asTrimmedString(req.body?.name, 100);
    const email = asTrimmedString(req.body?.email, 160).toLowerCase();
    const phone = asTrimmedString(req.body?.phone, 40);
    const address = asTrimmedString(req.body?.address, 250);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (phone.length < 6) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
      return;
    }

    const existing = db.users.find((u) => u.email === email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = {
      id: `usr-${crypto.randomUUID().slice(0, 10)}`,
      name,
      email,
      phone,
      address: address || undefined,
      passwordHash,
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    saveDatabase(db);

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const db = loadDatabase();
    const email = asTrimmedString(req.body?.email, 160).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.users.find((u) => u.email === email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role === 'admin') {
      res.json({
        user: {
          id: req.user.sub,
          name: req.user.name,
          email: req.user.email,
          phone: '',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    const db = loadDatabase();
    const user = db.users.find((u) => u.id === req.user?.sub);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role === 'admin') {
      res.status(400).json({ error: 'Admin profiles cannot be edited here.' });
      return;
    }
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === req.user?.sub);
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const name = asTrimmedString(req.body?.name, 100);
    const phone = asTrimmedString(req.body?.phone, 40);
    const address = asTrimmedString(req.body?.address, 250);

    if (name.length >= 2) user.name = name;
    if (phone.length >= 6) user.phone = phone;
    if (typeof req.body?.address === 'string') user.address = address || undefined;

    saveDatabase(db);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  // Orders: create, my orders, and live tracking
  app.post('/api/orders', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const customerName = asTrimmedString(req.body?.customerName, 100);
    const customerPhone = asTrimmedString(req.body?.customerPhone, 40);
    const customerEmail = asTrimmedString(req.body?.customerEmail, 160).toLowerCase();
    const fulfillmentType = req.body?.fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
    const deliveryAddress = asTrimmedString(req.body?.deliveryAddress, 250);
    const paymentMethod = req.body?.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Card';
    const promoCode = asTrimmedString(req.body?.promoCode, 30).toUpperCase();
    const notes = asTrimmedString(req.body?.notes, 400);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (customerName.length < 2 || customerPhone.length < 6) {
      res.status(400).json({ error: 'Please provide your full name and valid phone number.' });
      return;
    }
    if (fulfillmentType === 'delivery' && deliveryAddress.length < 5) {
      res.status(400).json({ error: 'Please enter a delivery address.' });
      return;
    }
    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' });
      return;
    }

    const orderItems: OrderItem[] = [];
    for (const entry of rawItems) {
      const productId = asTrimmedString(entry?.productId, 80);
      const quantity = Number(entry?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        res.status(400).json({ error: 'Invalid item or quantity in order.' });
        return;
      }
      const product = db.products.find((p) => p.id === productId && p.available);
      if (!product) {
        res.status(400).json({ error: 'One or more selected menu items are currently unavailable.' });
        return;
      }
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      });
    }

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    let discount = 0;
    let appliedPromo: string | undefined;
    if (promoCode === 'CAFEE15') {
      discount = roundMoney(subtotal * 0.15);
      appliedPromo = 'CAFEE15';
    } else if (promoCode === 'GOLD20' && subtotal >= 30) {
      discount = roundMoney(subtotal * 0.2);
      appliedPromo = 'GOLD20';
    }

    const taxable = Math.max(0, subtotal - discount);
    const tax = roundMoney(taxable * 0.08);
    const total = roundMoney(taxable + tax);

    db.orderCounter += 1;
    const now = new Date().toISOString();
    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 10)}`,
      orderNumber: `CF-${db.orderCounter}`,
      userId: req.user?.role === 'customer' ? req.user.sub : undefined,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
      paymentMethod,
      promoCode: appliedPromo,
      items: orderItems,
      subtotal,
      discount,
      tax,
      total,
      status: 'Received',
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(order);
    saveDatabase(db);
    res.status(201).json({ order });
  });

  app.get('/api/orders/mine', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const mine = db.orders.filter((o) => o.userId === req.user?.sub);
    res.json({ orders: mine });
  });

  app.get('/api/orders/track/:orderNumber', (req: Request, res: Response) => {
    const db = loadDatabase();
    const code = asTrimmedString(req.params.orderNumber, 40).toUpperCase();
    const order = db.orders.find((o) => o.orderNumber.toUpperCase() === code);
    if (!order) {
      res.status(404).json({ error: `Order ${code} was not found. Please check your order code.` });
      return;
    }

    res.json({
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        customerFirstName: order.customerName.split(' ')[0] || 'Guest',
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  });

  // Table Reservations
  app.post('/api/reservations', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const customerName = asTrimmedString(req.body?.customerName, 100);
    const customerPhone = asTrimmedString(req.body?.customerPhone, 40);
    const customerEmail = asTrimmedString(req.body?.customerEmail, 160).toLowerCase();
    const date = asTrimmedString(req.body?.date, 20);
    const time = asTrimmedString(req.body?.time, 20);
    const guests = Number(req.body?.guests);
    const seatingArea = VALID_SEATING_AREAS.includes(req.body?.seatingArea)
      ? (req.body.seatingArea as Reservation['seatingArea'])
      : 'Main Roastery Lounge';
    const specialRequests = asTrimmedString(req.body?.specialRequests, 400);

    if (customerName.length < 2 || customerPhone.length < 6) {
      res.status(400).json({ error: 'Please provide guest name and phone number.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Please choose a valid reservation date.' });
      return;
    }
    if (!time) {
      res.status(400).json({ error: 'Please choose a preferred reservation time.' });
      return;
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
      res.status(400).json({ error: 'Guest count must be between 1 and 20.' });
      return;
    }

    db.reservationCounter += 1;
    const reservation: Reservation = {
      id: `res-${crypto.randomUUID().slice(0, 10)}`,
      bookingCode: `RES-${db.reservationCounter}`,
      userId: req.user?.role === 'customer' ? req.user.sub : undefined,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      date,
      time,
      guests,
      seatingArea,
      specialRequests: specialRequests || undefined,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    db.reservations.unshift(reservation);
    saveDatabase(db);
    res.status(201).json({ reservation });
  });

  app.get('/api/reservations/mine', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const mine = db.reservations.filter((r) => r.userId === req.user?.sub);
    res.json({ reservations: mine });
  });

  // Admin Auth & First-Run Setup
  app.get('/api/admin/status', (_req: Request, res: Response) => {
    const db = loadDatabase();
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.json({ configured: true, mode: 'env' });
      return;
    }
    if (db.adminConfig) {
      res.json({ configured: true, mode: 'claimed', adminEmail: db.adminConfig.email });
      return;
    }
    res.json({ configured: false, mode: 'unclaimed' });
  });

  app.post('/api/admin/bootstrap', async (req: Request, res: Response) => {
    const db = loadDatabase();
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode || db.adminConfig) {
      res.status(409).json({ error: 'Admin access has already been configured.' });
      return;
    }

    const email = asTrimmedString(req.body?.email, 160).toLowerCase() || 'admin@cafee.com';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid admin email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    db.adminConfig = {
      email,
      passwordHash,
      claimedAt: new Date().toISOString(),
    };
    saveDatabase(db);

    const token = signAuthToken({
      sub: 'admin-root',
      email,
      name: 'CAFEE Administrator',
      role: 'admin',
    });

    res.status(201).json({
      token,
      admin: { email, name: 'CAFEE Administrator', role: 'admin' },
    });
  });

  app.post('/api/admin/login', async (req: Request, res: Response) => {
    const db = loadDatabase();
    const email = asTrimmedString(req.body?.email, 160).toLowerCase() || 'admin@cafee.com';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!password) {
      res.status(400).json({ error: 'Admin password or passcode is required.' });
      return;
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      if (!safeComparePasscode(password, envPasscode)) {
        res.status(401).json({ error: 'Invalid admin credentials.' });
        return;
      }
      const token = signAuthToken({
        sub: 'admin-root',
        email,
        name: 'CAFEE Administrator',
        role: 'admin',
      });
      res.json({
        token,
        admin: { email, name: 'CAFEE Administrator', role: 'admin' },
      });
      return;
    }

    if (!db.adminConfig) {
      res.status(409).json({ error: 'Admin setup is not completed yet.' });
      return;
    }

    if (email !== db.adminConfig.email) {
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    const ok = await verifyPassword(password, db.adminConfig.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    const token = signAuthToken({
      sub: 'admin-root',
      email: db.adminConfig.email,
      name: 'CAFEE Administrator',
      role: 'admin',
    });

    res.json({
      token,
      admin: { email: db.adminConfig.email, name: 'CAFEE Administrator', role: 'admin' },
    });
  });

  // Admin Protected Routes
  app.get('/api/admin/analytics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const validOrders = db.orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = roundMoney(validOrders.reduce((s, o) => s + o.total, 0));
    const totalOrders = db.orders.length;
    const activeOrders = db.orders.filter(
      (o) => o.status === 'Received' || o.status === 'Preparing' || o.status === 'Out for Delivery'
    ).length;
    const averageOrderValue = validOrders.length > 0 ? roundMoney(totalRevenue / validOrders.length) : 0;

    // 7-day rolling revenue chart
    const dailyMap = new Map<string, { label: string; revenue: number; orders: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyMap.set(key, { label, revenue: 0, orders: 0 });
    }

    for (const order of validOrders) {
      const dayKey = order.createdAt.slice(0, 10);
      const bucket = dailyMap.get(dayKey);
      if (bucket) {
        bucket.revenue = roundMoney(bucket.revenue + order.total);
        bucket.orders += 1;
      }
    }

    // Category revenue breakdown
    const catMap = new Map<string, { category: string; revenue: number; count: number }>();
    const productCatLookup = new Map<string, string>();
    for (const p of db.products) {
      productCatLookup.set(p.id, p.category);
    }
    for (const order of validOrders) {
      for (const item of order.items) {
        const cat = productCatLookup.get(item.productId) || 'Specialty';
        const existing = catMap.get(cat) || { category: cat, revenue: 0, count: 0 };
        existing.revenue = roundMoney(existing.revenue + item.price * item.quantity);
        existing.count += item.quantity;
        catMap.set(cat, existing);
      }
    }

    const categoryRevenue = Array.from(catMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const analytics: AdminAnalytics = {
      totalRevenue,
      totalOrders,
      activeOrders,
      totalReservations: db.reservations.length,
      totalCustomers: db.users.length,
      totalProducts: db.products.length,
      averageOrderValue,
      dailyRevenue: Array.from(dailyMap.values()),
      categoryRevenue,
    };

    res.json({ analytics });
  });

  app.post('/api/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const name = asTrimmedString(req.body?.name, 120);
    const category = asTrimmedString(req.body?.category, 60) as MenuCategory;
    const price = Number(req.body?.price);
    const description = asTrimmedString(req.body?.description, 500);
    const image = asTrimmedString(req.body?.image, 4_000_000);
    const originNote = asTrimmedString(req.body?.originNote, 80);
    const prepTime = asTrimmedString(req.body?.prepTime, 30) || '5 min';
    const featured = Boolean(req.body?.featured);
    const available = req.body?.available !== false;

    if (name.length < 2) {
      res.status(400).json({ error: 'Product name must be at least 2 characters.' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Please select a valid menu category.' });
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 1000) {
      res.status(400).json({ error: 'Price must be a valid positive number.' });
      return;
    }
    if (description.length < 8) {
      res.status(400).json({ error: 'Description must be at least 8 characters.' });
      return;
    }

    const finalImage = isValidImageReference(image)
      ? image
      : '/src/assets/images/menu_hot_espresso_1795629292221.jpg';

    const product: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 10)}`,
      name,
      category,
      price: roundMoney(price),
      description,
      image: finalImage,
      featured,
      available,
      originNote: originNote || undefined,
      prepTime,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(product);
    saveDatabase(db);
    res.status(201).json({ product });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const id = asTrimmedString(req.params.id, 80);
    const product = db.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const name = asTrimmedString(req.body?.name, 120);
    const category = asTrimmedString(req.body?.category, 60) as MenuCategory;
    const price = Number(req.body?.price);
    const description = asTrimmedString(req.body?.description, 500);
    const image = asTrimmedString(req.body?.image, 4_000_000);
    const originNote = asTrimmedString(req.body?.originNote, 80);
    const prepTime = asTrimmedString(req.body?.prepTime, 30);

    if (name.length >= 2) product.name = name;
    if (VALID_CATEGORIES.includes(category)) product.category = category;
    if (Number.isFinite(price) && price > 0 && price <= 1000) product.price = roundMoney(price);
    if (description.length >= 8) product.description = description;
    if (image && isValidImageReference(image)) product.image = image;
    if (typeof req.body?.originNote === 'string') product.originNote = originNote || undefined;
    if (prepTime) product.prepTime = prepTime;
    if (typeof req.body?.featured === 'boolean') product.featured = req.body.featured;
    if (typeof req.body?.available === 'boolean') product.available = req.body.available;

    saveDatabase(db);
    res.json({ product });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const id = asTrimmedString(req.params.id, 80);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    db.products.splice(idx, 1);
    saveDatabase(db);
    res.json({ deleted: true, id });
  });

  app.get('/api/admin/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    res.json({ orders: db.orders });
  });

  app.patch('/api/admin/orders/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const id = asTrimmedString(req.params.id, 80);
    const status = asTrimmedString(req.body?.status, 40) as OrderStatus;
    if (!VALID_ORDER_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }

    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ order });
  });

  app.get('/api/admin/reservations', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    res.json({ reservations: db.reservations });
  });

  app.patch('/api/admin/reservations/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const id = asTrimmedString(req.params.id, 80);
    const status = asTrimmedString(req.body?.status, 40) as ReservationStatus;
    if (!VALID_RESERVATION_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid reservation status.' });
      return;
    }

    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    reservation.status = status;
    saveDatabase(db);
    res.json({ reservation });
  });

  app.get('/api/admin/customers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const customers = db.users.map((u) => {
      const userOrders = db.orders.filter((o) => o.userId === u.id && o.status !== 'Cancelled');
      const totalSpent = roundMoney(userOrders.reduce((sum, o) => sum + o.total, 0));
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        createdAt: u.createdAt,
        orderCount: userOrders.length,
        totalSpent,
      };
    });
    res.json({ customers, contacts: db.contacts });
  });

  // Vite dev middleware or static production build serving
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  return app;
}

createApp()
  .then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CAFEE server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start CAFEE server:', err);
    process.exit(1);
  });
