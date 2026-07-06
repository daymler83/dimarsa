import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

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

  await Promise.all(
    authUsers.map((authUser, index) => {
      const user = seedUsers[index];

      return prisma.profile.upsert({
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
    }),
  );

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "lubricantes" },
      update: { name: "Lubricantes", sortOrder: 1 },
      create: { name: "Lubricantes", slug: "lubricantes", sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "accesorios" },
      update: { name: "Accesorios", sortOrder: 2 },
      create: { name: "Accesorios", slug: "accesorios", sortOrder: 2 },
    }),
  ]);

  const categoryIds = {
    lubricantes: categories[0].id,
    accesorios: categories[1].id,
  };

  const products = [
    {
      name: "Aceite 5W-30 Sintético 1L",
      slug: "aceite-5w-30-sintetico-1l",
      description: "Lubricante sintético para motores a bencina y diésel livianos.",
      price: "18990",
      compareAtPrice: "21990",
      imageUrl: "https://images.unsplash.com/photo-1613214150384-4f3475f0da03?auto=format&fit=crop&w=1200&q=80",
      categoryId: categoryIds.lubricantes,
      stock: 40,
    },
    {
      name: "Aceite 10W-40 Semisintético 4L",
      slug: "aceite-10w-40-semisintetico-4l",
      description: "Formato familiar para mantenciones programadas en taller o domicilio.",
      price: "32990",
      compareAtPrice: "35990",
      imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
      categoryId: categoryIds.lubricantes,
      stock: 24,
    },
    {
      name: "Líquido de Frenos DOT 4",
      slug: "liquido-de-frenos-dot-4",
      description: "Botella de 500 ml con alto punto de ebullición para uso urbano.",
      price: "8990",
      compareAtPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1200&q=80",
      categoryId: categoryIds.lubricantes,
      stock: 55,
    },
    {
      name: "Kit Limpieza Interior Premium",
      slug: "kit-limpieza-interior-premium",
      description: "Incluye limpiador, microfibra y protector de tablero.",
      price: "24990",
      compareAtPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
      categoryId: categoryIds.accesorios,
      stock: 18,
    },
    {
      name: "Soporte Magnético para Celular",
      slug: "soporte-magnetico-para-celular",
      description: "Soporte compacto para salpicadero compatible con la mayoría de smartphones.",
      price: "12990",
      compareAtPrice: "15990",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
      categoryId: categoryIds.accesorios,
      stock: 65,
    },
  ];

  await Promise.all(
    products.map((product) =>
      prisma.product.upsert({
        where: { slug: product.slug },
        update: product,
        create: product,
      }),
    ),
  );
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
