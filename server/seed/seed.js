require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
  Cart, Address, DeliveryTracking,
  DemandHistory, PricingRule, AgentLog, Notification
} = require('../models/index');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm2door';

// ─────────────────────────────────────────────────────────────────────────────
// ALL UNSPLASH IMAGE URLs — each manually verified to match the product
// Format: https://images.unsplash.com/photo-{ID}?w=600&q=80&fit=crop
// ─────────────────────────────────────────────────────────────────────────────
const IMG = {
  // VEGETABLES
  tomato:       'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80&fit=crop',
  onion:        'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=600&q=80&fit=crop',
  potato:       'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&fit=crop',
  carrot:       'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80&fit=crop',
  brinjal:      'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=600&q=80&fit=crop',
  bittergourd:  'https://images.unsplash.com/photo-1601275868399-f5a9dd0bfc85?w=600&q=80&fit=crop',

  // DAIRY
  milk:         'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80&fit=crop',
  curd:         'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&fit=crop',
  paneer:       'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80&fit=crop',
  ghee:         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',

  // FRUITS
  mango:        'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80&fit=crop',
  banana:       'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80&fit=crop',
  apple:        'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80&fit=crop',
  papaya:       'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&q=80&fit=crop',

  // GRAINS
  brownrice:    'https://images.unsplash.com/photo-1536304993881-ff86e1b1b745?w=600&q=80&fit=crop',
  masoorDal:    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80&fit=crop',
  jowarFlour:   'https://images.unsplash.com/photo-1612207745741-73f9f4c6d0e7?w=600&q=80&fit=crop',

  // ORGANIC
  turmeric:     'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80&fit=crop',
  bajra:        'https://images.unsplash.com/photo-1577003833619-76bbd7f3948a?w=600&q=80&fit=crop',

  // LEAFY GREENS
  spinach:      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80&fit=crop',
  methi:        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&fit=crop',
  coriander:    'https://images.unsplash.com/photo-1612257999756-cc0e9bbe76ba?w=600&q=80&fit=crop',
  cabbage:      'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&q=80&fit=crop',
  capsicum:     'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80&fit=crop',

  // HERBS
  mint:         'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&q=80&fit=crop',
  curryleaves:  'https://images.unsplash.com/photo-1582515073490-39981397c445?w=600&q=80&fit=crop',
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Clear all collections ──────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}), Farmer.deleteMany({}), Product.deleteMany({}),
    Order.deleteMany({}), Cart.deleteMany({}), Address.deleteMany({}),
    DeliveryTracking.deleteMany({}), DemandHistory.deleteMany({}),
    AgentLog.deleteMany({}), Notification.deleteMany({})
  ]);
  console.log('🗑️  Cleared all existing data');

  // ── IMPORTANT: pass PLAINTEXT password — User model pre-save hook hashes it ──
  // NEVER pre-hash here (causes double-hashing → login always fails)
  const PASS = 'Password@123';

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Admin User', email: 'admin@farm2door.com',
    password: PASS, phone: '9000000001',
    role: 'admin', isActive: true, isVerified: true
  });
  const customer1 = await User.create({
    name: 'Priya Sharma', email: 'customer@farm2door.com',
    password: PASS, phone: '9876543210',
    role: 'customer', isActive: true, isVerified: true
  });
  const customer2 = await User.create({
    name: 'Arjun Reddy', email: 'arjun@farm2door.com',
    password: PASS, phone: '9876543211',
    role: 'customer', isActive: true, isVerified: true
  });
  const fU1 = await User.create({ name: 'Ramesh Reddy',  email: 'ramesh@farm2door.com',   password: PASS, phone: '9111000001', role: 'farmer',   isActive: true, isVerified: true });
  const fU2 = await User.create({ name: 'Lakshmi Devi',  email: 'lakshmi@farm2door.com',  password: PASS, phone: '9111000002', role: 'farmer',   isActive: true, isVerified: true });
  const fU3 = await User.create({ name: 'Srinivas Rao',  email: 'srinivas@farm2door.com', password: PASS, phone: '9111000003', role: 'farmer',   isActive: true, isVerified: true });
  const fU4 = await User.create({ name: 'Anil Kumar',    email: 'anil@farm2door.com',     password: PASS, phone: '9111000004', role: 'farmer',   isActive: true, isVerified: true });
  const fU5 = await User.create({ name: 'Kavitha Naidu', email: 'kavitha@farm2door.com',  password: PASS, phone: '9111000005', role: 'farmer',   isActive: true, isVerified: true });
  const deliveryUser = await User.create({ name: 'Vijay Kumar', email: 'delivery@farm2door.com', password: PASS, phone: '9222000001', role: 'delivery', isActive: true, isVerified: true });
  console.log('✅ Users created  (password for all: Password@123)');

  // ── Farmers ────────────────────────────────────────────────────────────────
  const f1 = await Farmer.create({
    userId: fU1._id, farmName: 'Reddy Vegetable Farm',
    location: { address: 'Survey 42, Shamirpet', city: 'Hyderabad', state: 'Telangana', pincode: '500078', coordinates: { lat: 17.5326, lng: 78.5748 } },
    farmSize: '5 acres', crops: ['Tomato','Onion','Potato','Brinjal','Carrot','Bitter Gourd'],
    certifications: ['conventional'], rating: 4.7, totalSales: 125000, totalOrders: 340,
    isVerified: true, isActive: true,
    description: 'Family-run vegetable farm with 15+ years of experience. All produce harvested fresh daily at sunrise.',
    establishedYear: 2009
  });
  const f2 = await Farmer.create({
    userId: fU2._id, farmName: 'Lakshmi Dairy Farm',
    location: { address: 'Village Medchal', city: 'Medchal', state: 'Telangana', pincode: '501401', coordinates: { lat: 17.6268, lng: 78.4800 } },
    farmSize: '3 acres', crops: ['Milk','Curd','Paneer','Ghee','Butter'],
    certifications: ['natural'], rating: 4.9, totalSales: 230000, totalOrders: 890,
    isVerified: true, isActive: true,
    description: 'Premium A2 dairy from happy desi cows. No preservatives, no additives. Delivered before 7 AM daily.',
    establishedYear: 2005
  });
  const f3 = await Farmer.create({
    userId: fU3._id, farmName: 'Srinivas Fruit Orchard',
    location: { address: 'Nalgonda Highway', city: 'Nalgonda', state: 'Telangana', pincode: '508001', coordinates: { lat: 17.0575, lng: 79.2690 } },
    farmSize: '8 acres', crops: ['Mango','Banana','Apple','Papaya'],
    certifications: ['natural'], rating: 4.6, totalSales: 89000, totalOrders: 210,
    isVerified: true, isActive: true,
    description: 'Seasonal fruits from lush orchards. Alphonso mangoes are our speciality.',
    establishedYear: 2015
  });
  const f4 = await Farmer.create({
    userId: fU4._id, farmName: 'Anil Organic Farm',
    location: { address: 'Chevella Village', city: 'Rangareddy', state: 'Telangana', pincode: '501503', coordinates: { lat: 17.2990, lng: 78.1262 } },
    farmSize: '4 acres', crops: ['Brown Rice','Masoor Dal','Jowar Flour','Turmeric','Pearl Millet'],
    certifications: ['organic','gmp'], rating: 4.8, totalSales: 67000, totalOrders: 175,
    isVerified: true, isActive: true,
    description: 'Certified 100% organic. Zero pesticides. Healthy living for your family.',
    establishedYear: 2018
  });
  const f5 = await Farmer.create({
    userId: fU5._id, farmName: 'Kavitha Green Garden',
    location: { address: 'Dundigal Road', city: 'Hyderabad', state: 'Telangana', pincode: '500043', coordinates: { lat: 17.6087, lng: 78.3998 } },
    farmSize: '2 acres', crops: ['Spinach','Methi','Coriander','Cabbage','Capsicum','Mint','Curry Leaves'],
    certifications: ['natural'], rating: 4.5, totalSales: 45000, totalOrders: 130,
    isVerified: true, isActive: true,
    description: 'Fresh leafy greens and herbs harvested every morning. Same-day delivery.',
    establishedYear: 2019
  });
  console.log('✅ Farmers created');

  // ── Date helpers ───────────────────────────────────────────────────────────
  const d  = (days) => new Date(Date.now() + days * 86400000);
  const D2 = d(2); const D3 = d(3); const D7 = d(7);
  const D14 = d(14); const D30 = d(30); const D90 = d(90);
  const D180 = d(180); const D365 = d(365);

  // ── Products ───────────────────────────────────────────────────────────────
  // Each image URL is verified to actually show the correct product
  const products = await Product.create([

    // ═══════════════════════════════════════════════════════════════════════
    // VEGETABLES  (farmer: Ramesh — f1)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Fresh Tomatoes',
      nameTE: 'తాజా టమాటాలు',
      description: 'Bright red farm-fresh tomatoes harvested daily. Perfect for curries, rasam, salads and chutneys. No preservatives.',
      category: 'vegetables',
      farmerId: f1._id,
      images: [IMG.tomato],            // ✅ red tomatoes on vine
      basePrice: 30, currentPrice: 35, priceFloor: 20, priceCeiling: 80,
      unit: 'kg', stock: 150, minOrderQuantity: 0.5, maxOrderQuantity: 10,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: true, isTrending: true,
      totalSold: 520, rating: 4.6, reviewCount: 189, discount: 0,
      tags: ['tomato','vegetable','fresh','curry','rasam']
    },
    {
      name: 'Red Onions',
      nameTE: 'ఎర్ర ఉల్లిపాయలు',
      description: 'Pungent, flavourful red onions freshly harvested. Essential kitchen staple for every Indian household.',
      category: 'vegetables',
      farmerId: f1._id,
      images: [IMG.onion],             // ✅ red onions
      basePrice: 25, currentPrice: 28, priceFloor: 15, priceCeiling: 60,
      unit: 'kg', stock: 200, minOrderQuantity: 0.5, maxOrderQuantity: 10,
      expiryDate: D30, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 680, rating: 4.4, reviewCount: 210, discount: 0,
      tags: ['onion','vegetable','kitchen']
    },
    {
      name: 'Potatoes',
      nameTE: 'బంగాళాదుంపలు',
      description: 'Fresh creamy-white potatoes. Great for aloo sabzi, fries, biryani and paratha stuffing.',
      category: 'vegetables',
      farmerId: f1._id,
      images: [IMG.potato],            // ✅ potatoes
      basePrice: 20, currentPrice: 22, priceFloor: 12, priceCeiling: 50,
      unit: 'kg', stock: 300, minOrderQuantity: 0.5, maxOrderQuantity: 15,
      expiryDate: D30, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: true,
      totalSold: 890, rating: 4.5, reviewCount: 302, discount: 0,
      tags: ['potato','vegetable','starch']
    },
    {
      name: 'Carrots',
      nameTE: 'క్యారెట్లు',
      description: 'Crunchy orange carrots packed with beta-carotene and Vitamin A. Ideal for juicing, salads and halwa.',
      category: 'vegetables',
      farmerId: f1._id,
      images: [IMG.carrot],            // ✅ orange carrots
      basePrice: 35, currentPrice: 38, priceFloor: 25, priceCeiling: 80,
      unit: 'kg', stock: 80, minOrderQuantity: 0.5, maxOrderQuantity: 5,
      expiryDate: D14, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 320, rating: 4.7, reviewCount: 98, discount: 0,
      tags: ['carrot','vegetable','healthy','vitamin A']
    },
    {
      name: 'Brinjal (Eggplant)',
      nameTE: 'వంకాయ',
      description: 'Glossy purple brinjals freshly picked. Perfect for baingan bharta, curry, stir-fry and stuffed brinjal recipes.',
      category: 'vegetables',
      farmerId: f1._id,
      images: [IMG.brinjal],           // ✅ purple eggplants/brinjals
      basePrice: 30, currentPrice: 32, priceFloor: 20, priceCeiling: 70,
      unit: 'kg', stock: 60, minOrderQuantity: 0.25, maxOrderQuantity: 5,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 240, rating: 4.4, reviewCount: 76, discount: 0,
      tags: ['brinjal','eggplant','vegetable','baingan']
    },
    {
      name: 'Bitter Gourd (Karela)',
      nameTE: 'కాకర కాయ',
      description: 'Fresh bitter gourd known for blood-sugar management and medicinal properties. Thinly sliced and stuffed variety available.',
      category: 'vegetables',
      farmerId: f1._id,
      images: [IMG.bittergourd],       // ✅ bitter gourd / karela
      basePrice: 40, currentPrice: 45, priceFloor: 30, priceCeiling: 90,
      unit: 'kg', stock: 45, minOrderQuantity: 0.25, maxOrderQuantity: 5,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 165, rating: 4.3, reviewCount: 55, discount: 0,
      tags: ['karela','bitter gourd','medicinal','diabetes']
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DAIRY  (farmer: Lakshmi — f2)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Fresh A2 Cow Milk',
      nameTE: 'తాజా A2 ఆవు పాలు',
      description: 'Pure A2 milk from our desi cows. Delivered before 7 AM daily. Boil and enjoy — no preservatives, no adulteration.',
      category: 'dairy',
      farmerId: f2._id,
      images: [IMG.milk],              // ✅ glass milk bottle / milk
      basePrice: 60, currentPrice: 65, priceFloor: 55, priceCeiling: 95,
      unit: 'litre', stock: 100, minOrderQuantity: 0.5, maxOrderQuantity: 5,
      expiryDate: D2, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: true, isTrending: true,
      totalSold: 1240, rating: 4.9, reviewCount: 456, discount: 0,
      tags: ['milk','dairy','A2','fresh','cow']
    },
    {
      name: 'Thick Curd (Dahi)',
      nameTE: 'పెరుగు',
      description: 'Creamy thick curd set fresh every morning from A2 milk. Probiotic-rich. Perfect with biryani, parathas and raita.',
      category: 'dairy',
      farmerId: f2._id,
      images: [IMG.curd],              // ✅ white curd / yoghurt in bowl
      basePrice: 50, currentPrice: 55, priceFloor: 40, priceCeiling: 85,
      unit: 'kg', stock: 80, minOrderQuantity: 0.25, maxOrderQuantity: 3,
      expiryDate: D3, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: true, isTrending: false,
      totalSold: 780, rating: 4.8, reviewCount: 289, discount: 0,
      tags: ['curd','dahi','dairy','probiotic','yoghurt']
    },
    {
      name: 'Fresh Paneer',
      nameTE: 'పన్నీర్',
      description: 'Soft, crumbly fresh paneer made daily from pure A2 cow milk. Ideal for paneer butter masala, palak paneer, tikka.',
      category: 'dairy',
      farmerId: f2._id,
      images: [IMG.paneer],            // ✅ white paneer cubes
      basePrice: 280, currentPrice: 300, priceFloor: 250, priceCeiling: 420,
      unit: 'kg', stock: 40, minOrderQuantity: 0.25, maxOrderQuantity: 2,
      expiryDate: D3, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: true, isTrending: true,
      totalSold: 420, rating: 4.9, reviewCount: 312, discount: 0,
      tags: ['paneer','dairy','protein','fresh','cottage cheese']
    },
    {
      name: 'Pure Cow Ghee',
      nameTE: 'స్వచ్ఛమైన ఆవు నెయ్యి',
      description: 'Traditionally churned golden desi cow ghee. Rich aroma, high smoke point. Made fresh in small batches — no dalda, no shortcuts.',
      category: 'dairy',
      farmerId: f2._id,
      images: [IMG.ghee],              // ✅ golden ghee in jar
      basePrice: 600, currentPrice: 650, priceFloor: 550, priceCeiling: 900,
      unit: 'kg', stock: 25, minOrderQuantity: 0.25, maxOrderQuantity: 1,
      expiryDate: D365, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 180, rating: 4.9, reviewCount: 145, discount: 0,
      tags: ['ghee','dairy','traditional','pure','desi']
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FRUITS  (farmer: Srinivas — f3)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Alphonso Mangoes',
      nameTE: 'అల్ఫాన్సో మామిడికాయలు',
      description: 'Premium Alphonso mangoes — the King of Mangoes. Sweet, pulpy, saffron-coloured flesh. Seasonal delight from our orchard.',
      category: 'fruits',
      farmerId: f3._id,
      images: [IMG.mango],             // ✅ golden alphonso mangoes
      basePrice: 200, currentPrice: 240, priceFloor: 180, priceCeiling: 400,
      unit: 'kg', stock: 90, minOrderQuantity: 0.5, maxOrderQuantity: 5,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: true, isTrending: true,
      totalSold: 560, rating: 4.9, reviewCount: 398, discount: 0,
      tags: ['mango','alphonso','fruit','seasonal','premium']
    },
    {
      name: 'Robusta Bananas',
      nameTE: 'అరటి పండ్లు',
      description: 'Yellow Robusta bananas naturally ripened on the tree. Rich in potassium and instant energy. Great for kids and athletes.',
      category: 'fruits',
      farmerId: f3._id,
      images: [IMG.banana],            // ✅ yellow bananas
      basePrice: 40, currentPrice: 45, priceFloor: 30, priceCeiling: 80,
      unit: 'dozen', stock: 120, minOrderQuantity: 1, maxOrderQuantity: 10,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 920, rating: 4.5, reviewCount: 267, discount: 0,
      tags: ['banana','fruit','potassium','energy']
    },
    {
      name: 'Himachali Apples',
      nameTE: 'హిమాచలీ యాపిల్',
      description: 'Crisp, juicy apples from the hills of Himachal Pradesh. Rich red skin, sweet-tart taste. High in dietary fibre.',
      category: 'fruits',
      farmerId: f3._id,
      images: [IMG.apple],             // ✅ red apples
      basePrice: 150, currentPrice: 170, priceFloor: 130, priceCeiling: 280,
      unit: 'kg', stock: 70, minOrderQuantity: 0.5, maxOrderQuantity: 5,
      expiryDate: D14, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: true, isTrending: false,
      totalSold: 380, rating: 4.7, reviewCount: 156, discount: 0,
      tags: ['apple','fruit','himachali','crisp','fibre']
    },
    {
      name: 'Sweet Papaya',
      nameTE: 'తీపి బొప్పాయి',
      description: 'Ripe orange-fleshed papaya loaded with Vitamins C & A and digestive enzymes (papain). Naturally sweet, great for breakfast.',
      category: 'fruits',
      farmerId: f3._id,
      images: [IMG.papaya],            // ✅ orange papaya cut open
      basePrice: 35, currentPrice: 40, priceFloor: 25, priceCeiling: 70,
      unit: 'kg', stock: 60, minOrderQuantity: 0.5, maxOrderQuantity: 5,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 245, rating: 4.5, reviewCount: 89, discount: 0,
      tags: ['papaya','fruit','tropical','vitamin C','digestive']
    },

    // ═══════════════════════════════════════════════════════════════════════
    // GRAINS  (farmer: Anil Organic — f4)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Organic Brown Rice',
      nameTE: 'ఆర్గానిక్ బ్రౌన్ రైస్',
      description: 'Pesticide-free organic brown rice. High in dietary fibre, minerals and B vitamins. Nutty flavour, excellent for daily use.',
      category: 'grains',
      farmerId: f4._id,
      images: [IMG.brownrice],         // ✅ brown rice grains
      basePrice: 90, currentPrice: 100, priceFloor: 75, priceCeiling: 160,
      unit: 'kg', stock: 200, minOrderQuantity: 1, maxOrderQuantity: 25,
      expiryDate: D180, harvestDate: d(-15),
      isOrganic: true, isAvailable: true, isFeatured: true, isTrending: false,
      totalSold: 310, rating: 4.7, reviewCount: 134, discount: 0,
      tags: ['rice','organic','grains','healthy','fibre','brown rice']
    },
    {
      name: 'Red Masoor Dal',
      nameTE: 'మసూర్ పప్పు',
      description: 'Certified organic red lentils (masoor dal). High protein, zero chemicals. Cooks in under 15 minutes. Rich earthy taste.',
      category: 'grains',
      farmerId: f4._id,
      images: [IMG.masoorDal],         // ✅ red/orange lentils
      basePrice: 110, currentPrice: 120, priceFloor: 90, priceCeiling: 180,
      unit: 'kg', stock: 150, minOrderQuantity: 0.5, maxOrderQuantity: 10,
      expiryDate: D365, harvestDate: d(-10),
      isOrganic: true, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 280, rating: 4.8, reviewCount: 102, discount: 0,
      tags: ['dal','lentils','organic','protein','masoor']
    },
    {
      name: 'Jowar (Sorghum) Flour',
      nameTE: 'జొన్న పిండి',
      description: 'Stone-ground jowar (sorghum) flour — naturally gluten-free. Rich in iron and fibre. Perfect for rotis, bhakris and porridge.',
      category: 'grains',
      farmerId: f4._id,
      images: [IMG.jowarFlour],        // ✅ white flour in bowl
      basePrice: 70, currentPrice: 75, priceFloor: 55, priceCeiling: 120,
      unit: 'kg', stock: 120, minOrderQuantity: 0.5, maxOrderQuantity: 10,
      expiryDate: D180, harvestDate: d(0),
      isOrganic: true, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 145, rating: 4.6, reviewCount: 58, discount: 0,
      tags: ['jowar','sorghum','flour','gluten-free','millet']
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ORGANIC  (farmer: Anil Organic — f4)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Organic Turmeric Powder',
      nameTE: 'ఆర్గానిక్ పసుపు పొడి',
      description: 'High-curcumin organic turmeric powder, stone-ground from fresh rhizomes. Anti-inflammatory, immune-boosting. Pure — no colour added.',
      category: 'organic',
      farmerId: f4._id,
      images: [IMG.turmeric],          // ✅ bright yellow turmeric powder
      basePrice: 150, currentPrice: 160, priceFloor: 120, priceCeiling: 260,
      unit: 'kg', stock: 80, minOrderQuantity: 0.1, maxOrderQuantity: 2,
      expiryDate: D365, harvestDate: d(-20),
      isOrganic: true, isAvailable: true, isFeatured: true, isTrending: false,
      totalSold: 490, rating: 4.9, reviewCount: 287, discount: 0,
      tags: ['turmeric','haldi','spice','organic','medicinal','curcumin']
    },
    {
      name: 'Organic Pearl Millet (Bajra)',
      nameTE: 'ఆర్గానిక్ సజ్జలు',
      description: 'Whole organic bajra (pearl millet) grains. Gluten-free, high in iron and magnesium. Great for rotis, khichdi and porridge.',
      category: 'organic',
      farmerId: f4._id,
      images: [IMG.bajra],             // ✅ pearl millet / bajra grains
      basePrice: 55, currentPrice: 60, priceFloor: 45, priceCeiling: 100,
      unit: 'kg', stock: 100, minOrderQuantity: 0.5, maxOrderQuantity: 10,
      expiryDate: D180, harvestDate: d(0),
      isOrganic: true, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 120, rating: 4.6, reviewCount: 45, discount: 0,
      tags: ['bajra','pearl millet','organic','gluten-free','iron']
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LEAFY GREENS  (farmer: Kavitha — f5)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Fresh Spinach (Palak)',
      nameTE: 'పాలకూర',
      description: 'Tender baby spinach leaves, harvested fresh every morning. Rich in iron, folate and Vitamin K. Stays crisp for 2 days.',
      category: 'leafy',
      farmerId: f5._id,
      images: [IMG.spinach],           // ✅ green spinach leaves
      basePrice: 20, currentPrice: 25, priceFloor: 15, priceCeiling: 55,
      unit: 'bundle', stock: 100, minOrderQuantity: 1, maxOrderQuantity: 10,
      expiryDate: D2, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: true,
      totalSold: 760, rating: 4.8, reviewCount: 298, discount: 0,
      tags: ['spinach','palak','leafy','iron','green']
    },
    {
      name: 'Methi (Fenugreek Leaves)',
      nameTE: 'మెంతికూర',
      description: 'Fresh fenugreek (methi) bunches with a distinctive earthy, slightly bitter flavour. Essential for methi paratha, dal methi and sabzi.',
      category: 'leafy',
      farmerId: f5._id,
      images: [IMG.methi],             // ✅ green fenugreek / methi leaves
      basePrice: 15, currentPrice: 18, priceFloor: 10, priceCeiling: 40,
      unit: 'bundle', stock: 80, minOrderQuantity: 1, maxOrderQuantity: 10,
      expiryDate: D2, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 540, rating: 4.7, reviewCount: 198, discount: 0,
      tags: ['methi','fenugreek','leafy','green','bitter']
    },
    {
      name: 'Fresh Coriander',
      nameTE: 'కొత్తిమీర',
      description: 'Fragrant green coriander bunches with stems. Packed with Vitamin K. Essential for chutneys, garnish and biryani.',
      category: 'leafy',
      farmerId: f5._id,
      images: [IMG.coriander],         // ✅ fresh coriander / cilantro
      basePrice: 10, currentPrice: 12, priceFloor: 8, priceCeiling: 30,
      unit: 'bundle', stock: 120, minOrderQuantity: 1, maxOrderQuantity: 10,
      expiryDate: D2, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 980, rating: 4.6, reviewCount: 312, discount: 0,
      tags: ['coriander','dhania','cilantro','herb','garnish']
    },
    {
      name: 'Green Cabbage',
      nameTE: 'క్యాబేజీ',
      description: 'Firm, compact green cabbage heads. Crisp and sweet. Ideal for coleslaw, stir-fry, sabzi and stuffed parathas.',
      category: 'leafy',
      farmerId: f5._id,
      images: [IMG.cabbage],           // ✅ green cabbage head
      basePrice: 25, currentPrice: 28, priceFloor: 18, priceCeiling: 55,
      unit: 'piece', stock: 90, minOrderQuantity: 1, maxOrderQuantity: 10,
      expiryDate: D14, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 380, rating: 4.5, reviewCount: 132, discount: 0,
      tags: ['cabbage','leafy','coleslaw','salad']
    },
    {
      name: 'Green Capsicum',
      nameTE: 'పచ్చి మిరప',
      description: 'Crunchy bright green bell peppers. Low calorie, high in Vitamin C. Great for stir-fry, stuffed capsicum and salads.',
      category: 'leafy',
      farmerId: f5._id,
      images: [IMG.capsicum],          // ✅ green bell peppers / capsicum
      basePrice: 60, currentPrice: 65, priceFloor: 45, priceCeiling: 120,
      unit: 'kg', stock: 55, minOrderQuantity: 0.25, maxOrderQuantity: 3,
      expiryDate: D7, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 265, rating: 4.5, reviewCount: 98, discount: 0,
      tags: ['capsicum','bell pepper','green','vitamin C']
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HERBS  (farmer: Kavitha — f5)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'Fresh Mint Leaves',
      nameTE: 'పుదీనా ఆకులు',
      description: 'Aromatic fresh mint bunches harvested at peak fragrance. Essential for chutney, raita, biryani, mojito and lemonade.',
      category: 'herbs',
      farmerId: f5._id,
      images: [IMG.mint],              // ✅ bright green mint leaves
      basePrice: 10, currentPrice: 12, priceFloor: 8, priceCeiling: 30,
      unit: 'bundle', stock: 150, minOrderQuantity: 1, maxOrderQuantity: 10,
      expiryDate: D2, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: true,
      totalSold: 620, rating: 4.8, reviewCount: 225, discount: 0,
      tags: ['mint','pudina','herb','chutney','aromatic']
    },
    {
      name: 'Fresh Curry Leaves',
      nameTE: 'కరివేపాకు',
      description: 'Glossy dark-green curry leaves with their signature aroma. Adds authentic South Indian flavour to tempering, curries and rice.',
      category: 'herbs',
      farmerId: f5._id,
      images: [IMG.curryleaves],       // ✅ dark green curry leaves on stem
      basePrice: 5, currentPrice: 8, priceFloor: 5, priceCeiling: 25,
      unit: 'bundle', stock: 200, minOrderQuantity: 1, maxOrderQuantity: 20,
      expiryDate: D3, harvestDate: d(0),
      isOrganic: false, isAvailable: true, isFeatured: false, isTrending: false,
      totalSold: 1100, rating: 4.7, reviewCount: 389, discount: 0,
      tags: ['curry leaves','kadi patta','herb','south indian','tempering']
    },
  ]);

  console.log(`✅ ${products.length} Products created — all images verified`);

  // ── Addresses ──────────────────────────────────────────────────────────────
  const addr1 = await Address.create({
    userId: customer1._id, label: 'home',
    name: 'Priya Sharma', phone: '9876543210',
    addressLine1: 'Flat 302, Green Valley Apts, Madhapur',
    city: 'Hyderabad', state: 'Telangana', pincode: '500081',
    coordinates: { lat: 17.4484, lng: 78.3915 }, isDefault: true
  });
  const addr2 = await Address.create({
    userId: customer2._id, label: 'home',
    name: 'Arjun Reddy', phone: '9876543211',
    addressLine1: '12-4-56, Banjara Hills, Road No 10',
    city: 'Hyderabad', state: 'Telangana', pincode: '500034',
    coordinates: { lat: 17.4156, lng: 78.4501 }, isDefault: true
  });

  // ── Sample Orders (10 orders for bestsellers / recommendation engine) ───────
  const statuses = ['delivered','delivered','delivered','out_for_delivery','confirmed','pending','delivered','packed','delivered','delivered'];
  for (let i = 0; i < 10; i++) {
    const cust = i % 2 === 0 ? customer1 : customer2;
    const addr = i % 2 === 0 ? addr1 : addr2;
    const status = statuses[i];
    const prods = products.slice(i % 5, (i % 5) + 3);
    const items = prods.map(p => ({
      productId: p._id, farmerId: p.farmerId,
      name: p.name, image: p.images[0],
      quantity: 1, unit: p.unit,
      priceAtOrder: p.currentPrice,
      subtotal: p.currentPrice
    }));
    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const taxes = Math.round(subtotal * 0.05);
    const total = Math.round(subtotal + deliveryFee + taxes);

    const order = await Order.create({
      customerId: cust._id, items,
      deliveryAddress: { name: addr.name, phone: addr.phone, addressLine1: addr.addressLine1, city: addr.city, state: addr.state, pincode: addr.pincode },
      status, paymentMethod: i % 3 === 0 ? 'cod' : 'upi',
      paymentStatus: ['delivered','out_for_delivery','packed','confirmed'].includes(status) ? 'paid' : 'pending',
      subtotal: Math.round(subtotal), deliveryFee, taxes, total,
      deliveryPartnerId: ['out_for_delivery','delivered'].includes(status) ? deliveryUser._id : null,
      estimatedDelivery: new Date(Date.now() + 86400000),
      actualDelivery: status === 'delivered' ? new Date(Date.now() - i * 43200000) : null,
      statusHistory: [{ status: 'pending', note: 'Order placed', updatedBy: cust._id }],
      farmerStatuses: [...new Set(items.map(it => it.farmerId?.toString()).filter(Boolean))].map(fId => ({ farmerId: fId, status: status === 'pending' ? 'pending' : 'accepted' })),
      createdAt: new Date(Date.now() - i * 2 * 86400000)
    });

    if (['out_for_delivery','delivered'].includes(status)) {
      await DeliveryTracking.create({
        orderId: order._id, deliveryPartnerId: deliveryUser._id,
        status: status === 'delivered' ? 'delivered' : 'out_for_delivery',
        currentLocation: { lat: 17.4484, lng: 78.3915 }
      });
    }
  }
  console.log('✅ 10 sample orders created');

  // ── Pricing Rules ──────────────────────────────────────────────────────────
  try {
    const { PricingRule } = require('../models/index');
    await PricingRule.deleteMany({});
    await PricingRule.create([
      {
        ruleType: 'demand_surge',
        condition: { demandThreshold: 80 },
        action: { adjustmentType: 'percentage', adjustmentValue: 15 },
        isActive: true, createdBy: adminUser._id
      },
      {
        ruleType: 'expiry_discount',
        condition: { daysToExpiry: 3 },
        action: { adjustmentType: 'percentage', adjustmentValue: -25 },
        isActive: true, createdBy: adminUser._id
      },
      {
        ruleType: 'anti_hoarding',
        condition: { supplyThreshold: 10 },
        action: { adjustmentType: 'fixed', adjustmentValue: 0 },
        isActive: true, createdBy: adminUser._id
      }
    ]);
    console.log('✅ Pricing rules created');
  } catch (e) { console.warn('Pricing rules skipped:', e.message); }

  // ── Welcome notification for demo customers ────────────────────────────────
  await Notification.create([
    { userId: customer1._id, title: '🌱 Welcome to Farm2Door!', message: 'Fresh farm produce delivered to your door. Start shopping!', type: 'general', read: false },
    { userId: customer2._id, title: '🌱 Welcome to Farm2Door!', message: 'Fresh farm produce delivered to your door. Start shopping!', type: 'general', read: false },
  ]);

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log('\n✅ ═══════════════════════════════════════════════════════════');
  console.log('✅         Farm2Door Database Seeded Successfully!');
  console.log('✅ ═══════════════════════════════════════════════════════════\n');
  console.log('🔑  DEMO LOGIN CREDENTIALS  (all use: Password@123)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('👑  Admin    →  admin@farm2door.com      /  Password@123');
  console.log('🛒  Customer →  customer@farm2door.com   /  Password@123');
  console.log('🌾  Farmer   →  ramesh@farm2door.com     /  Password@123');
  console.log('🚚  Delivery →  delivery@farm2door.com   /  Password@123');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`\n📦  ${products.length} Products | 10 Users | 5 Farmers | 10 Orders\n`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ SEED FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
