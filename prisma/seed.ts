import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

import { generateSlug } from "../src/lib/utils";

const prisma = new PrismaClient();

const requiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const supabase = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: "admin" | "seller";
  sellerCode?: string;
};

const seedUsers: SeedUser[] = [
  {
    email: "admin@dimarza.cl",
    password: "admin123",
    fullName: "Administrador Dimarza",
    phone: "+56 9 1111 1111",
    role: "admin",
  },
  {
    email: "camila.rojas@dimarza.cl",
    password: "seller123",
    fullName: "Camila Rojas",
    phone: "+56 9 8123 4567",
    role: "seller",
    sellerCode: "C4M8L2",
  },
  {
    email: "jorge.soto@dimarza.cl",
    password: "seller123",
    fullName: "Jorge Soto",
    phone: "+56 9 9345 6789",
    role: "seller",
    sellerCode: "J7R2G5",
  },
  {
    email: "valentina.diaz@dimarza.cl",
    password: "seller123",
    fullName: "Valentina Díaz",
    phone: "+56 9 9876 5432",
    role: "seller",
    sellerCode: "V9L3T6",
  },
];

async function ensureAuthUser(user: SeedUser) {
  const existingUsers = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (existingUsers.error) {
    throw existingUsers.error;
  }

  const existing = existingUsers.data.users.find((item) => item.email === user.email);

  if (existing) {
    return existing;
  }

  const createdUser = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.fullName,
      role: user.role,
    },
  });

  if (createdUser.error || !createdUser.data.user) {
    throw createdUser.error ?? new Error(`Could not create auth user for ${user.email}`);
  }

  return createdUser.data.user;
}

async function main() {
  const authUsers = await Promise.all(seedUsers.map(ensureAuthUser));

  // Secuencial (no Promise.all): el pooler de Supabase en session mode
  // limita las conexiones concurrentes, y con varias decenas de upserts
  // en paralelo se agota ese límite.
  for (const [index, authUser] of authUsers.entries()) {
    const user = seedUsers[index];

    await prisma.profile.upsert({
      where: { id: authUser.id },
      update: {
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        sellerCode: user.sellerCode ?? null,
        active: true,
      },
      create: {
        id: authUser.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        sellerCode: user.sellerCode ?? null,
        active: true,
      },
    });
  }

  // ---------------------------------------------------------------------
  // DEMO / PLACEHOLDER CATALOG
  // Categorías y productos de ejemplo (retail chileno) para poblar el
  // catálogo público mientras no tengamos la base real de Dimarsa
  // (dimarsa.cl). Nombres, marcas, precios y stock son referenciales.
  // Cuando llegue el catálogo real, esto se reemplaza mapeando campos
  // sobre el mismo modelo (Category/Product) -- no hace falta rehacerlo.
  // imageUrl apunta a fotos de stock de Unsplash elegidas por categoría
  // (no son fotos del producto real) solo para que la demo no se vea
  // vacía; se reemplazan por las fotos reales del catálogo de Dimarsa.
  // ---------------------------------------------------------------------

  const unsplash = (photoId: string) =>
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;

  const categoryDefs = [
    { name: "Tecnología", sortOrder: 1 },
    { name: "Electrohogar", sortOrder: 2 },
    { name: "Dormitorio y Muebles", sortOrder: 3 },
    { name: "Herramientas y Maquinarias", sortOrder: 4 },
    { name: "Deportes y Aire Libre", sortOrder: 5 },
  ];

  const categories = [];
  for (const category of categoryDefs) {
    const slug = generateSlug(category.name);
    categories.push(
      await prisma.category.upsert({
        where: { slug },
        update: { name: category.name, sortOrder: category.sortOrder },
        create: { name: category.name, slug, sortOrder: category.sortOrder },
      }),
    );
  }

  const categoryIds = {
    tecnologia: categories[0].id,
    electrohogar: categories[1].id,
    dormitorioYMuebles: categories[2].id,
    herramientasYMaquinarias: categories[3].id,
    deportesYAireLibre: categories[4].id,
  };

  const productDefs = [
    // Tecnología
    { name: 'Smart TV Samsung 55" 4K UHD Crystal', description: "Resolución 4K, HDR y sistema Tizen con apps integradas.", price: "399990", compareAtPrice: "449990", categoryId: categoryIds.tecnologia, stock: 12, imageUrl: unsplash("photo-1593359677879-a4bb92f829d1") },
    { name: 'Notebook Lenovo IdeaPad 3 15.6" i5', description: "Procesador Intel Core i5, 8GB RAM, 512GB SSD.", price: "449990", compareAtPrice: "499990", categoryId: categoryIds.tecnologia, stock: 8, imageUrl: unsplash("photo-1496181133206-80ce9b88a853") },
    { name: "Audífonos Inalámbricos JBL Tune 510BT", description: "Bluetooth 5.0 con hasta 40 horas de batería.", price: "24990", compareAtPrice: "29990", categoryId: categoryIds.tecnologia, stock: 30, imageUrl: unsplash("photo-1505740420928-5e560c06d30e") },
    { name: "Smartphone Xiaomi Redmi Note 13", description: 'Pantalla AMOLED 6.67", 256GB, cámara 108MP.', price: "199990", compareAtPrice: null, categoryId: categoryIds.tecnologia, stock: 15, imageUrl: unsplash("photo-1512499617640-c74ae3a79d37") },
    { name: "Parlante Bluetooth Sony SRS-XB100", description: "Sonido potente y resistente al agua IP67.", price: "29990", compareAtPrice: "34990", categoryId: categoryIds.tecnologia, stock: 22, imageUrl: unsplash("photo-1608043152269-423dbba4e7e1") },
    // Electrohogar
    { name: "Refrigerador Mademsa No Frost 300L", description: "Frío directo, eficiencia energética A+.", price: "349990", compareAtPrice: "399990", categoryId: categoryIds.electrohogar, stock: 6, imageUrl: unsplash("photo-1571175443880-49e1d25b2bc5") },
    { name: "Lavadora Automática LG 11kg", description: "Carga superior, motor inverter silencioso.", price: "299990", compareAtPrice: null, categoryId: categoryIds.electrohogar, stock: 9, imageUrl: unsplash("photo-1626806787461-102c1bfaaea1") },
    { name: "Microondas Whirlpool 20L", description: "8 niveles de potencia y grill.", price: "79990", compareAtPrice: "89990", categoryId: categoryIds.electrohogar, stock: 18, imageUrl: unsplash("photo-1585659722983-3a675dabf23d") },
    { name: "Aspiradora Robot Cecotec Conga", description: "Navegación inteligente y control por app.", price: "159990", compareAtPrice: "189990", categoryId: categoryIds.electrohogar, stock: 10, imageUrl: unsplash("photo-1558317374-067fb5f30001") },
    { name: "Cafetera Oster Espresso", description: "Sistema de presión de 15 bares con vaporizador.", price: "49990", compareAtPrice: null, categoryId: categoryIds.electrohogar, stock: 14, imageUrl: unsplash("photo-1495474472287-4d71bcdd2085") },
    // Dormitorio y Muebles
    { name: "Cama Europea Rosen 2 Plazas", description: "Base tapizada con cabecero incluido.", price: "249990", compareAtPrice: "289990", categoryId: categoryIds.dormitorioYMuebles, stock: 5, imageUrl: unsplash("photo-1505693416388-ac5ce068fe85") },
    { name: "Set de Sábanas Rosen Percal 200 Hilos", description: "Algodón 100%, incluye funda de almohada.", price: "34990", compareAtPrice: null, categoryId: categoryIds.dormitorioYMuebles, stock: 25, imageUrl: unsplash("photo-1522771739844-6a9f6d5f14af") },
    { name: "Velador Rústico 2 Cajones", description: "Madera maciza con terminación natural.", price: "39990", compareAtPrice: null, categoryId: categoryIds.dormitorioYMuebles, stock: 12, imageUrl: unsplash("photo-1519710164239-da123dc03ef4") },
    { name: "Closet Modular 4 Puertas", description: "Amplio espacio de almacenaje, fácil armado.", price: "129990", compareAtPrice: "149990", categoryId: categoryIds.dormitorioYMuebles, stock: 7, imageUrl: unsplash("photo-1558997519-83ea9252edf8") },
    { name: "Almohada Viscoelástica Rosen", description: "Memory foam con funda transpirable.", price: "19990", compareAtPrice: "24990", categoryId: categoryIds.dormitorioYMuebles, stock: 40, imageUrl: unsplash("photo-1584100936595-c0654b55a2e2") },
    // Herramientas y Maquinarias
    { name: "Taladro Percutor Bauker 750W", description: "Incluye maletín y set de brocas.", price: "39990", compareAtPrice: "49990", categoryId: categoryIds.herramientasYMaquinarias, stock: 20, imageUrl: unsplash("photo-1504148455328-c376907d081c") },
    { name: 'Esmeril Angular Bosch 4.5"', description: "Motor de 720W para corte y desbaste.", price: "34990", compareAtPrice: null, categoryId: categoryIds.herramientasYMaquinarias, stock: 16, imageUrl: unsplash("photo-1572981779307-38b8cabb2407") },
    { name: "Set de Herramientas Stanley 65 Piezas", description: "Maletín completo para el hogar y taller.", price: "44990", compareAtPrice: "54990", categoryId: categoryIds.herramientasYMaquinarias, stock: 11, imageUrl: unsplash("photo-1530124566582-a618bc2615dc") },
    { name: "Generador Eléctrico Lusqtoff 2000W", description: "Motor a gasolina, ideal para uso ocasional.", price: "249990", compareAtPrice: null, categoryId: categoryIds.herramientasYMaquinarias, stock: 4, imageUrl: unsplash("photo-1621905251189-08b45d6a269e") },
    { name: "Compresor de Aire Bauker 24L", description: "Silencioso, ideal para pintura e inflado.", price: "89990", compareAtPrice: "99990", categoryId: categoryIds.herramientasYMaquinarias, stock: 9, imageUrl: unsplash("photo-1581092160562-40aa08e78837") },
    // Deportes y Aire Libre
    { name: "Bicicleta Mountain Bike Oxford Aro 29", description: "Cuadro de aluminio y 21 velocidades.", price: "179990", compareAtPrice: "209990", categoryId: categoryIds.deportesYAireLibre, stock: 8, imageUrl: unsplash("photo-1485965120184-e220f721d03e") },
    { name: "Carpa de Camping Doite 4 Personas", description: "Impermeable, armado rápido en minutos.", price: "69990", compareAtPrice: null, categoryId: categoryIds.deportesYAireLibre, stock: 13, imageUrl: unsplash("photo-1504280390367-361c6d9f38f4") },
    { name: "Set de Pesas Ajustables 20kg", description: "Discos de goma con barra incluida.", price: "59990", compareAtPrice: "69990", categoryId: categoryIds.deportesYAireLibre, stock: 15, imageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b") },
    { name: "Trotadora Eléctrica Athletic Works", description: "Motor de 2HP con panel digital.", price: "299990", compareAtPrice: "349990", categoryId: categoryIds.deportesYAireLibre, stock: 5, imageUrl: unsplash("photo-1571902943202-507ec2618e8f") },
    { name: "Bolsa de Dormir Doite -5°C", description: "Aislación térmica para camping en montaña.", price: "44990", compareAtPrice: null, categoryId: categoryIds.deportesYAireLibre, stock: 17, imageUrl: unsplash("photo-1478131143081-80f7f84ca84d") },
  ];

  for (const product of productDefs) {
    const slug = generateSlug(product.name);

    await prisma.product.upsert({
      where: { slug },
      update: { ...product, slug },
      create: { ...product, slug },
    });
  }

  // ---------------------------------------------------------------------
  // DEMO CATALOGS (catalog-selection spec)
  // Dos catalogos de ejemplo que ejercitan el modelo flexible: uno hecho
  // de categorias completas, otro mezclando una categoria completa con
  // productos sueltos de otra categoria (para probar la union sin
  // duplicados). Idempotente via upsert por slug.
  // ---------------------------------------------------------------------

  const looseProductSlugs = [
    generateSlug("Bicicleta Mountain Bike Oxford Aro 29"),
    generateSlug("Carpa de Camping Doite 4 Personas"),
  ];

  const looseProducts = await prisma.product.findMany({
    where: { slug: { in: looseProductSlugs } },
    select: { id: true },
  });

  const catalogDefs = [
    {
      name: "Tecnología y Hogar",
      description: "Todo lo último en electrónica y electrodomésticos para la casa.",
      isActive: true,
      categoryIds: [categoryIds.tecnologia, categoryIds.electrohogar],
      productIds: [] as string[],
    },
    {
      name: "Ferretería y Aire Libre",
      description: "Herramientas para el taller, más algunos productos de aire libre destacados.",
      isActive: true,
      categoryIds: [categoryIds.herramientasYMaquinarias],
      productIds: looseProducts.map((product) => product.id),
    },
  ];

  for (const catalog of catalogDefs) {
    const slug = generateSlug(catalog.name);

    const existing = await prisma.catalog.findUnique({ where: { slug }, select: { id: true } });

    if (existing) {
      await prisma.$transaction([
        prisma.catalogCategory.deleteMany({ where: { catalogId: existing.id } }),
        prisma.catalogProduct.deleteMany({ where: { catalogId: existing.id } }),
        prisma.catalog.update({
          where: { id: existing.id },
          data: {
            name: catalog.name,
            description: catalog.description,
            isActive: catalog.isActive,
            categories: { create: catalog.categoryIds.map((categoryId) => ({ categoryId })) },
            products: { create: catalog.productIds.map((productId) => ({ productId })) },
          },
        }),
      ]);
    } else {
      await prisma.catalog.create({
        data: {
          name: catalog.name,
          slug,
          description: catalog.description,
          isActive: catalog.isActive,
          categories: { create: catalog.categoryIds.map((categoryId) => ({ categoryId })) },
          products: { create: catalog.productIds.map((productId) => ({ productId })) },
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
