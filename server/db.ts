import fs from 'node:fs';
import path from 'node:path';
import type {
  ContactMessage,
  CustomerReview,
  MenuCategory,
  Order,
  Product,
  Reservation,
} from '../src/types.ts';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface AdminCredentialConfig {
  email: string;
  passwordHash: string;
  claimedAt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  products: Product[];
  orders: Order[];
  reservations: Reservation[];
  reviews: CustomerReview[];
  contacts: ContactMessage[];
  adminConfig: AdminCredentialConfig | null;
  orderCounter: number;
  reservationCounter: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cafee-db.json');

const SEED_PRODUCTS: Array<Omit<Product, 'createdAt'>> = [
  {
    id: 'prod-hot-1',
    name: 'Ethiopian Yirgacheffe Pour-Over',
    category: 'Hot Coffee',
    price: 6.5,
    description: 'Hand-poured V60 single-origin brew with jasmine aroma, bergamot zest, and velvety cocoa finish.',
    image: '/src/assets/images/menu_hot_espresso_1795629292221.jpg',
    featured: true,
    available: true,
    originNote: 'Single Origin · Ethiopia',
    prepTime: '5 min',
  },
  {
    id: 'prod-hot-2',
    name: 'Velvet Roast Americano',
    category: 'Hot Coffee',
    price: 5.0,
    description: 'Double shot of our signature dark roast pulled over 92°C mineral-balanced spring water.',
    image: '/src/assets/images/menu_hot_espresso_1795629292221.jpg',
    featured: false,
    available: true,
    originNote: 'House Blend',
    prepTime: '3 min',
  },
  {
    id: 'prod-cold-1',
    name: 'Kyoto 14-Hour Cold Brew',
    category: 'Cold Coffee',
    price: 7.5,
    description: 'Slow-dripped over crystal ice for fourteen hours, delivering dark cherry sweetness and zero bitterness.',
    image: '/src/assets/images/menu_cold_coffee_1795629292764.jpg',
    featured: true,
    available: true,
    originNote: 'Cold Steeped · 14h',
    prepTime: '2 min',
  },
  {
    id: 'prod-cold-2',
    name: 'Madagascar Cream Cold Foam',
    category: 'Cold Coffee',
    price: 8.25,
    description: 'Chilled artisan cold brew crowned with lightly salted vanilla bean micro-foam.',
    image: '/src/assets/images/menu_cold_coffee_1795629292764.jpg',
    featured: false,
    available: true,
    originNote: 'Vanilla Bean Foam',
    prepTime: '3 min',
  },
  {
    id: 'prod-cap-1',
    name: 'Classic Venetian Cappuccino',
    category: 'Cappuccino',
    price: 6.5,
    description: 'Equal parts rich double espresso, steamed whole milk, and glossy cocoa-dusted microfoam.',
    image: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg',
    featured: true,
    available: true,
    originNote: 'Velvet Microfoam',
    prepTime: '4 min',
  },
  {
    id: 'prod-cap-2',
    name: 'Spiced Gold Cardamom Cappuccino',
    category: 'Cappuccino',
    price: 7.5,
    description: 'Freshly crushed green cardamom infused into steamed milk with raw wildflower honey and dark cocoa.',
    image: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg',
    featured: false,
    available: true,
    originNote: 'Cardamom & Honey',
    prepTime: '4 min',
  },
  {
    id: 'prod-esp-1',
    name: 'Signature CAFEE Gold Espresso',
    category: 'Espresso',
    price: 4.75,
    description: 'Syrupy tiger-striped crema with notes of roasted hazelnut, bittersweet chocolate, and toasted caramel.',
    image: '/src/assets/images/menu_hot_espresso_1795629292221.jpg',
    featured: false,
    available: true,
    originNote: 'Double Ristretto',
    prepTime: '2 min',
  },
  {
    id: 'prod-esp-2',
    name: 'Artisan Cortado',
    category: 'Espresso',
    price: 5.5,
    description: 'Balanced 1:1 pairing of double ristretto espresso and warm silky microfoam in fluted glass.',
    image: '/src/assets/images/menu_hot_espresso_1795629292221.jpg',
    featured: false,
    available: true,
    originNote: '1:1 Espresso & Milk',
    prepTime: '3 min',
  },
  {
    id: 'prod-lat-1',
    name: 'Salted Caramel Honeycomb Latte',
    category: 'Latte',
    price: 7.75,
    description: 'Silky espresso latte swirled with house-torched salted caramel and crisp honeycomb brittle.',
    image: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg',
    featured: true,
    available: true,
    originNote: 'House Caramel',
    prepTime: '4 min',
  },
  {
    id: 'prod-lat-2',
    name: 'Roasted Pistachio Oat Latte',
    category: 'Latte',
    price: 7.95,
    description: 'Creamy barista oat milk infused with Sicilian roasted pistachio cream and bright espresso.',
    image: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg',
    featured: false,
    available: true,
    originNote: 'Plant-Based · Sicilian Pistachio',
    prepTime: '4 min',
  },
  {
    id: 'prod-shk-1',
    name: 'Belgian Chocolate Hazelnut Shake',
    category: 'Milkshakes',
    price: 9.5,
    description: '70% Belgian dark chocolate gelato spun with roasted Piedmont hazelnuts and espresso cream.',
    image: '/src/assets/images/menu_milkshake_1795629293968.jpg',
    featured: false,
    available: true,
    originNote: 'Belgian Gelato',
    prepTime: '5 min',
  },
  {
    id: 'prod-shk-2',
    name: 'Espresso Tiramisu Thick Shake',
    category: 'Milkshakes',
    price: 9.75,
    description: 'Mascarpone vanilla ice cream blended with chilled double espresso and cocoa biscuit crumble.',
    image: '/src/assets/images/menu_milkshake_1795629293968.jpg',
    featured: false,
    available: true,
    originNote: 'Mascarpone & Espresso',
    prepTime: '5 min',
  },
  {
    id: 'prod-tea-1',
    name: 'Royal Saffron & Cardamom Tea',
    category: 'Tea',
    price: 6.75,
    description: 'Whole-leaf Assam steeped with Kashmiri saffron threads, green cardamom pods, and delicate rose.',
    image: '/src/assets/images/menu_artisan_tea_1795629293916.jpg',
    featured: false,
    available: true,
    originNote: 'Kashmiri Saffron',
    prepTime: '5 min',
  },
  {
    id: 'prod-tea-2',
    name: 'Reserve Bergamot Earl Grey',
    category: 'Tea',
    price: 6.0,
    description: 'First-flush Ceylon black tea scented with cold-pressed Calabrian bergamot oil in a glass pot.',
    image: '/src/assets/images/menu_artisan_tea_1795629293916.jpg',
    featured: false,
    available: true,
    originNote: 'Loose-Leaf Pot',
    prepTime: '4 min',
  },
  {
    id: 'prod-brg-1',
    name: 'Truffle Wagyu Brioche Burger',
    category: 'Burgers',
    price: 18.5,
    description: 'Double seared wagyu patties, aged cheddar, caramelized shallots, wild arugula, and black truffle aioli.',
    image: '/src/assets/images/menu_gourmet_burger_1795629295410.jpg',
    featured: true,
    available: true,
    originNote: 'House Brioche · Fries Included',
    prepTime: '14 min',
  },
  {
    id: 'prod-brg-2',
    name: 'Crispy Halloumi & Harissa Burger',
    category: 'Burgers',
    price: 15.5,
    description: 'Golden seared Mediterranean halloumi, roasted red pepper harissa glaze, pickled fennel, and mint yogurt.',
    image: '/src/assets/images/menu_gourmet_burger_1795629295410.jpg',
    featured: false,
    available: true,
    originNote: 'Vegetarian',
    prepTime: '12 min',
  },
  {
    id: 'prod-piz-1',
    name: 'Wood-Fired Burrata & Truffle Pizza',
    category: 'Pizza',
    price: 21.0,
    description: '48-hour fermented sourdough crust topped with San Marzano tomatoes, wild mushrooms, and creamy burrata.',
    image: '/src/assets/images/menu_woodfired_pizza_1795629295114.jpg',
    featured: true,
    available: true,
    originNote: '48h Sourdough',
    prepTime: '15 min',
  },
  {
    id: 'prod-piz-2',
    name: 'Artisan Margherita Classica',
    category: 'Pizza',
    price: 18.0,
    description: 'Blistered wood-fired sourdough, fior di latte mozzarella, sweet garden basil, and cold-pressed olive oil.',
    image: '/src/assets/images/menu_woodfired_pizza_1795629295114.jpg',
    featured: false,
    available: true,
    originNote: 'Wood-Fired · Vegetarian',
    prepTime: '14 min',
  },
  {
    id: 'prod-snd-1',
    name: 'Herb Chicken & Pesto Sourdough Panini',
    category: 'Sandwiches',
    price: 14.5,
    description: 'Slow-roasted rosemary chicken breast, hass avocado, melted aged gruyère, and house basil pesto.',
    image: '/src/assets/images/menu_artisan_sandwich_1795629296102.jpg',
    featured: false,
    available: true,
    originNote: 'Toasted Sourdough',
    prepTime: '10 min',
  },
  {
    id: 'prod-snd-2',
    name: 'Smoked Salmon & Whipped Ricotta Tartine',
    category: 'Sandwiches',
    price: 15.5,
    description: 'Cold-smoked Atlantic salmon over lemon-herb ricotta, caperberries, and dill on warm country loaf.',
    image: '/src/assets/images/menu_artisan_sandwich_1795629296102.jpg',
    featured: false,
    available: true,
    originNote: 'Open-Faced Tartine',
    prepTime: '9 min',
  },
  {
    id: 'prod-des-1',
    name: '24K Gold-Leaf Belgian Opera Cake',
    category: 'Cakes & Desserts',
    price: 11.0,
    description: 'Delicate almond joconde sponge layered with espresso buttercream, dark ganache, and edible gold leaf.',
    image: '/src/assets/images/menu_cakes_desserts_1795629306572.jpg',
    featured: true,
    available: true,
    originNote: 'Patisserie Signature',
    prepTime: '3 min',
  },
  {
    id: 'prod-des-2',
    name: 'Roasted Pistachio Espresso Tiramisu',
    category: 'Cakes & Desserts',
    price: 10.5,
    description: 'Espresso-soaked savoiardi layered with whipped mascarpone mousse and crushed roasted green pistachios.',
    image: '/src/assets/images/menu_cakes_desserts_1795629306572.jpg',
    featured: false,
    available: true,
    originNote: 'House Mascarpone',
    prepTime: '3 min',
  },
];

function createSeedDatabase(): DatabaseSchema {
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now.getTime() - days * 86400000);
    return d.toISOString();
  };

  const products: Product[] = SEED_PRODUCTS.map((p) => ({
    ...p,
    createdAt: daysAgo(14),
  }));

  const sampleOrders: Order[] = [
    {
      id: 'ord-seed-1',
      orderNumber: 'CF-1041',
      customerName: 'Elena Vance',
      customerPhone: '+1 (415) 555-0148',
      customerEmail: 'elena.vance@example.com',
      fulfillmentType: 'delivery',
      deliveryAddress: '412 Octavia St, San Francisco, CA',
      paymentMethod: 'Card',
      items: [
        {
          productId: 'prod-hot-1',
          name: 'Ethiopian Yirgacheffe Pour-Over',
          price: 6.5,
          quantity: 2,
          image: '/src/assets/images/menu_hot_espresso_1795629292221.jpg',
        },
        {
          productId: 'prod-des-1',
          name: '24K Gold-Leaf Belgian Opera Cake',
          price: 11.0,
          quantity: 1,
          image: '/src/assets/images/menu_cakes_desserts_1795629306572.jpg',
        },
      ],
      subtotal: 24.0,
      discount: 0,
      tax: 1.92,
      total: 25.92,
      status: 'Completed',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      id: 'ord-seed-2',
      orderNumber: 'CF-1042',
      customerName: 'Marcus Sterling',
      customerPhone: '+1 (415) 555-0192',
      customerEmail: 'marcus.s@example.com',
      fulfillmentType: 'pickup',
      paymentMethod: 'Card',
      items: [
        {
          productId: 'prod-piz-1',
          name: 'Wood-Fired Burrata & Truffle Pizza',
          price: 21.0,
          quantity: 1,
          image: '/src/assets/images/menu_woodfired_pizza_1795629295114.jpg',
        },
        {
          productId: 'prod-cold-1',
          name: 'Kyoto 14-Hour Cold Brew',
          price: 7.5,
          quantity: 2,
          image: '/src/assets/images/menu_cold_coffee_1795629292764.jpg',
        },
      ],
      subtotal: 36.0,
      discount: 0,
      tax: 2.88,
      total: 38.88,
      status: 'Preparing',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(0),
    },
    {
      id: 'ord-seed-3',
      orderNumber: 'CF-1043',
      customerName: 'Nadia Al-Mansoor',
      customerPhone: '+1 (415) 555-0174',
      customerEmail: 'nadia.m@example.com',
      fulfillmentType: 'delivery',
      deliveryAddress: '880 Sutter St, Apt 4B, San Francisco, CA',
      paymentMethod: 'Card',
      items: [
        {
          productId: 'prod-brg-1',
          name: 'Truffle Wagyu Brioche Burger',
          price: 18.5,
          quantity: 2,
          image: '/src/assets/images/menu_gourmet_burger_1795629295410.jpg',
        },
        {
          productId: 'prod-shk-1',
          name: 'Belgian Chocolate Hazelnut Shake',
          price: 9.5,
          quantity: 2,
          image: '/src/assets/images/menu_milkshake_1795629293968.jpg',
        },
      ],
      subtotal: 56.0,
      discount: 0,
      tax: 4.48,
      total: 60.48,
      status: 'Out for Delivery',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: 'ord-seed-4',
      orderNumber: 'CF-1044',
      customerName: 'Daniela Ross',
      customerPhone: '+1 (415) 555-0166',
      fulfillmentType: 'pickup',
      paymentMethod: 'Cash on Delivery',
      items: [
        {
          productId: 'prod-cap-1',
          name: 'Classic Venetian Cappuccino',
          price: 6.5,
          quantity: 3,
          image: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg',
        },
        {
          productId: 'prod-snd-1',
          name: 'Herb Chicken & Pesto Sourdough Panini',
          price: 14.5,
          quantity: 2,
          image: '/src/assets/images/menu_artisan_sandwich_1795629296102.jpg',
        },
      ],
      subtotal: 48.5,
      discount: 0,
      tax: 3.88,
      total: 52.38,
      status: 'Completed',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: 'ord-seed-5',
      orderNumber: 'CF-1045',
      customerName: 'Julian Park',
      customerPhone: '+1 (415) 555-0119',
      fulfillmentType: 'delivery',
      deliveryAddress: '201 Spear St, Suite 900, San Francisco, CA',
      paymentMethod: 'Card',
      items: [
        {
          productId: 'prod-lat-1',
          name: 'Salted Caramel Honeycomb Latte',
          price: 7.75,
          quantity: 4,
          image: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg',
        },
        {
          productId: 'prod-des-2',
          name: 'Roasted Pistachio Espresso Tiramisu',
          price: 10.5,
          quantity: 2,
          image: '/src/assets/images/menu_cakes_desserts_1795629306572.jpg',
        },
      ],
      subtotal: 52.0,
      discount: 0,
      tax: 4.16,
      total: 56.16,
      status: 'Completed',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ];

  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

  const sampleReservations: Reservation[] = [
    {
      id: 'res-seed-1',
      bookingCode: 'RES-8812',
      customerName: 'Camille Laurent',
      customerPhone: '+1 (415) 555-0133',
      date: todayStr,
      time: '19:30',
      guests: 4,
      seatingArea: 'Golden Courtyard',
      specialRequests: 'Anniversary dessert candle if possible.',
      status: 'Confirmed',
      createdAt: daysAgo(2),
    },
    {
      id: 'res-seed-2',
      bookingCode: 'RES-8813',
      customerName: 'Henrik Lindqvist',
      customerPhone: '+1 (415) 555-0185',
      date: tomorrowStr,
      time: '10:00',
      guests: 2,
      seatingArea: 'Espresso Bar Counter',
      specialRequests: 'Pour-over tasting flight for two.',
      status: 'Confirmed',
      createdAt: daysAgo(1),
    },
  ];

  const reviews: CustomerReview[] = [
    {
      id: 'rev-1',
      authorName: 'Sophia Bennett',
      roleOrVisit: 'Interior Architect · Morning Regular',
      rating: 5,
      comment:
        'Before discovering CAFEE, my client meetings felt rushed in noisy chains. Now the Golden Courtyard, Kyoto cold brew, and saffron tea turn every briefing into an unhurried ritual.',
      createdAt: daysAgo(12),
    },
    {
      id: 'rev-2',
      authorName: 'Devon Takahashi',
      roleOrVisit: 'Culinary Director · Weekend Brunch',
      rating: 5,
      comment:
        'Rarely does a roastery execute wood-fired sourdough pizza and wagyu brioche at this caliber. The burrata pizza paired with a Venetian cappuccino is unmatched in the city.',
      createdAt: daysAgo(8),
    },
    {
      id: 'rev-3',
      authorName: 'Amira Farouk',
      roleOrVisit: 'Product Lead · Evening Patisserie',
      rating: 5,
      comment:
        'Ordering online for our studio team is effortless—live tracking is spot-on, and the 24K Opera Cake arrives looking like it came straight from a Parisian showcase.',
      createdAt: daysAgo(4),
    },
  ];

  return {
    users: [],
    products,
    orders: sampleOrders,
    reservations: sampleReservations,
    reviews,
    contacts: [],
    adminConfig: null,
    orderCounter: 1045,
    reservationCounter: 8813,
  };
}

let cachedDb: DatabaseSchema | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDatabase(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      const seed = createSeedDatabase();
      cachedDb = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : seed.products,
        orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
        reservations: Array.isArray(parsed.reservations) ? parsed.reservations : seed.reservations,
        reviews: Array.isArray(parsed.reviews) && parsed.reviews.length > 0 ? parsed.reviews : seed.reviews,
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
        adminConfig: parsed.adminConfig ?? null,
        orderCounter: typeof parsed.orderCounter === 'number' ? parsed.orderCounter : 1045,
        reservationCounter: typeof parsed.reservationCounter === 'number' ? parsed.reservationCounter : 8813,
      };
      return cachedDb;
    } catch {
      cachedDb = createSeedDatabase();
      saveDatabase(cachedDb);
      return cachedDb;
    }
  }
  cachedDb = createSeedDatabase();
  saveDatabase(cachedDb);
  return cachedDb;
}

export function saveDatabase(db: DatabaseSchema): void {
  ensureDataDir();
  cachedDb = db;
  const tmpFile = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

export const VALID_CATEGORIES: MenuCategory[] = [
  'Hot Coffee',
  'Cold Coffee',
  'Cappuccino',
  'Espresso',
  'Latte',
  'Milkshakes',
  'Tea',
  'Burgers',
  'Pizza',
  'Sandwiches',
  'Cakes & Desserts',
];
